package com.expensetracker.service;

import com.expensetracker.dto.InsightResponse;
import com.expensetracker.model.*;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class InsightService {

    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<InsightResponse> generateInsights(String email) {
        User user = getUser(email);
        Long userId = user.getId();
        List<InsightResponse> insights = new ArrayList<>();

        LocalDate today = LocalDate.now();
        int curMonth = today.getMonthValue();
        int curYear = today.getYear();

        LocalDate lastMonthDate = today.minusMonths(1);
        int prevMonth = lastMonthDate.getMonthValue();
        int prevYear = lastMonthDate.getYear();

        // 1. Month-over-Month Category Analysis
        List<Category> categories = categoryRepository.findByUserId(userId);
        for (Category category : categories) {
            BigDecimal currentTotal = expenseRepository.getMonthlyTotalByCategory(userId, category.getId(), curMonth, curYear);
            BigDecimal prevTotal = expenseRepository.getMonthlyTotalByCategory(userId, category.getId(), prevMonth, prevYear);

            if (currentTotal == null) currentTotal = BigDecimal.ZERO;
            if (prevTotal == null) prevTotal = BigDecimal.ZERO;

            if (prevTotal.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal diff = currentTotal.subtract(prevTotal);
                BigDecimal increasePct = diff.multiply(BigDecimal.valueOf(100.0)).divide(prevTotal, 2, RoundingMode.HALF_UP);

                if (increasePct.compareTo(BigDecimal.valueOf(15.0)) > 0) {
                    insights.add(InsightResponse.builder()
                            .type("WARNING")
                            .title(category.getName() + " Spending Trend")
                            .description(String.format("You have spent %s on %s this month, which is %s%% higher than last month's spending (%s). Consider reviewing this category.",
                                    formatCurrency(currentTotal), category.getName(), increasePct, formatCurrency(prevTotal)))
                            .impactValue(increasePct + "%")
                            .build());
                } else if (increasePct.compareTo(BigDecimal.valueOf(-15.0)) < 0) {
                    BigDecimal savingsPct = increasePct.negate();
                    insights.add(InsightResponse.builder()
                            .type("SUCCESS")
                            .title(category.getName() + " Savings Success")
                            .description(String.format("Great job! You have reduced your %s spending by %s%% compared to last month. Total spent: %s.",
                                    category.getName(), savingsPct, formatCurrency(currentTotal)))
                            .impactValue(savingsPct + "%")
                            .build());
                }
            }
        }

        // 2. Budget Burn Velocity Check
        List<Budget> budgets = budgetRepository.findByUserId(userId);
        Budget overallBudget = budgets.stream()
                .filter(b -> b.getCategory() == null)
                .findFirst()
                .orElse(null);

        BigDecimal monthlyTotal = expenseRepository.getMonthlyTotal(userId, curMonth, curYear);
        if (monthlyTotal == null) monthlyTotal = BigDecimal.ZERO;

        if (overallBudget != null && overallBudget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal budgetAmt = overallBudget.getAmount();
            double budgetSpentPct = monthlyTotal.multiply(BigDecimal.valueOf(100.0)).divide(budgetAmt, 2, RoundingMode.HALF_UP).doubleValue();
            
            double monthPassedPct = (double) today.getDayOfMonth() / today.lengthOfMonth() * 100.0;

            if (budgetSpentPct >= 100.0) {
                insights.add(InsightResponse.builder()
                        .type("WARNING")
                        .title("Budget Exceeded")
                        .description(String.format("You have exceeded your overall monthly budget limit of %s! Total spending: %s.",
                                formatCurrency(budgetAmt), formatCurrency(monthlyTotal)))
                        .impactValue(formatCurrency(monthlyTotal.subtract(budgetAmt)))
                        .build());
            } else if (budgetSpentPct >= 80.0) {
                insights.add(InsightResponse.builder()
                        .type("WARNING")
                        .title("Approaching Overall Budget")
                        .description(String.format("You have consumed %s%% of your overall monthly budget of %s. Remaining: %s.",
                                String.format("%.1f", budgetSpentPct), formatCurrency(budgetAmt), formatCurrency(budgetAmt.subtract(monthlyTotal))))
                        .impactValue(String.format("%.1f%%", budgetSpentPct))
                        .build());
            } else if (budgetSpentPct > monthPassedPct + 15.0) {
                // Burning too fast
                insights.add(InsightResponse.builder()
                        .type("WARNING")
                        .title("High Spending Velocity")
                        .description(String.format("You have spent %s%% of your monthly budget in only %d days (%s%% of the month). At this rate, you will exceed your budget before the month ends.",
                                String.format("%.1f", budgetSpentPct), today.getDayOfMonth(), String.format("%.1f", monthPassedPct)))
                        .impactValue(String.format("%.1f%%", budgetSpentPct))
                        .build());
            } else if (budgetSpentPct < monthPassedPct - 15.0 && monthlyTotal.compareTo(BigDecimal.ZERO) > 0) {
                // Spending safely under budget
                insights.add(InsightResponse.builder()
                        .type("SUCCESS")
                        .title("Excellent Budget Pace")
                        .description(String.format("Fantastic budget pacing! You are on Day %d of the month (%s%% complete) but have spent only %s%% of your target monthly limit of %s.",
                                today.getDayOfMonth(), String.format("%.1f", monthPassedPct), String.format("%.1f", budgetSpentPct), formatCurrency(budgetAmt)))
                        .impactValue(formatCurrency(budgetAmt.subtract(monthlyTotal)))
                        .build());
            }
        } else {
            // Nudge to set a budget
            insights.add(InsightResponse.builder()
                    .type("INFO")
                    .title("Set a Monthly Budget")
                    .description("Setting an overall monthly spending budget helps you keep track of limits and alerts you if you spend too fast. Tap the 'Budgets' section on your dashboard to get started!")
                    .build());
        }

        // 3. Highlight Single Largest Expense
        List<Expense> curMonthExpenses = expenseRepository.findByUserIdAndDateBetween(
                userId,
                today.withDayOfMonth(1),
                today.withDayOfMonth(today.lengthOfMonth())
        );

        if (!curMonthExpenses.isEmpty()) {
            Expense largest = curMonthExpenses.stream()
                    .max((e1, e2) -> e1.getAmount().compareTo(e2.getAmount()))
                    .get();

            if (largest.getAmount().compareTo(BigDecimal.valueOf(1000.0)) > 0) {
                insights.add(InsightResponse.builder()
                        .type("INFO")
                        .title("Largest Expense Highlight")
                        .description(String.format("Your single largest transaction this month is '%s' for %s on %s.",
                                largest.getTitle(), formatCurrency(largest.getAmount()),
                                largest.getDate().toString()))
                        .impactValue(formatCurrency(largest.getAmount()))
                        .build());
            }
        }

        return insights;
    }

    private String formatCurrency(BigDecimal amount) {
        NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return format.format(amount);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}

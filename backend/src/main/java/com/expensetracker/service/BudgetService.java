package com.expensetracker.service;

import com.expensetracker.dto.BudgetRequest;
import com.expensetracker.dto.BudgetResponse;
import com.expensetracker.model.Budget;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<BudgetResponse> getBudgets(String email) {
        User user = getUser(email);
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();

        return budgetRepository.findByUserId(user.getId())
                .stream()
                .map(budget -> toResponse(budget, month, year))
                .collect(Collectors.toList());
    }

    public BudgetResponse setBudget(BudgetRequest request, String email) {
        User user = getUser(email);
        Category category = null;

        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            if (!category.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Access denied: You don't own this category");
            }
        }

        // Check if budget already exists for this category/overall
        Optional<Budget> existingOpt = request.getCategoryId() != null
                ? budgetRepository.findByUserIdAndCategoryId(user.getId(), request.getCategoryId())
                : budgetRepository.findByUserIdAndCategoryIsNull(user.getId());

        Budget budget;
        if (existingOpt.isPresent()) {
            budget = existingOpt.get();
            budget.setAmount(request.getAmount());
        } else {
            budget = Budget.builder()
                    .amount(request.getAmount())
                    .category(category)
                    .user(user)
                    .build();
        }

        Budget saved = budgetRepository.save(budget);
        LocalDate now = LocalDate.now();
        return toResponse(saved, now.getMonthValue(), now.getYear());
    }

    public void deleteBudget(Long id, String email) {
        User user = getUser(email);
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You don't own this budget");
        }

        budgetRepository.deleteById(id);
    }

    private BudgetResponse toResponse(Budget budget, int month, int year) {
        BigDecimal currentSpending;
        if (budget.getCategory() != null) {
            currentSpending = expenseRepository.getMonthlyTotalByCategory(
                    budget.getUser().getId(),
                    budget.getCategory().getId(),
                    month,
                    year
            );
        } else {
            currentSpending = expenseRepository.getMonthlyTotal(
                    budget.getUser().getId(),
                    month,
                    year
            );
        }

        if (currentSpending == null) {
            currentSpending = BigDecimal.ZERO;
        }

        double progress = 0.0;
        if (budget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            progress = currentSpending.multiply(BigDecimal.valueOf(100.0))
                    .divide(budget.getAmount(), 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .amount(budget.getAmount())
                .categoryId(budget.getCategory() != null ? budget.getCategory().getId() : null)
                .categoryName(budget.getCategory() != null ? budget.getCategory().getName() : "Overall Budget")
                .categoryColor(budget.getCategory() != null ? budget.getCategory().getColor() : "#6c63ff")
                .currentSpending(currentSpending)
                .progressPercentage(progress)
                .build();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}

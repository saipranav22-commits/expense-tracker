package com.expensetracker.service;

import com.expensetracker.dto.ExpenseRequest;
import com.expensetracker.dto.ExpenseResponse;
import com.expensetracker.model.Category;
import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public List<ExpenseResponse> getAllExpenses(String email) {
        User user = getUser(email);
        return expenseRepository.findByUserIdOrderByDateDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> getExpensesByCategory(Long categoryId, String email) {
        User user = getUser(email);
        return expenseRepository.findByUserIdAndCategoryIdOrderByDateDesc(user.getId(), categoryId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ExpenseResponse> searchExpenses(String keyword, String email) {
        User user = getUser(email);
        return expenseRepository.findByUserIdAndTitleContainingIgnoreCaseOrderByDateDesc(user.getId(), keyword)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ExpenseResponse addExpense(ExpenseRequest request, String email) {
        User user = getUser(email);

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Expense expense = Expense.builder()
                .title(request.getTitle())
                .amount(request.getAmount())
                .date(request.getDate())
                .description(request.getDescription())
                .category(category)
                .user(user)
                .build();

        Expense saved = expenseRepository.save(expense);
        return toResponse(saved);
    }

    public ExpenseResponse updateExpense(Long id, ExpenseRequest request, String email) {
        User user = getUser(email);
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You don't own this expense");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            if (!category.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Access denied: You don't own this category");
            }
        }

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setDescription(request.getDescription());
        expense.setCategory(category);

        Expense updated = expenseRepository.save(expense);
        return toResponse(updated);
    }

    public void deleteExpense(Long id, String email) {
        User user = getUser(email);
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You don't own this expense");
        }

        expenseRepository.deleteById(id);
    }

    public Map<String, Object> getSummary(String email) {
        User user = getUser(email);
        Long userId = user.getId();

        LocalDate now = LocalDate.now();
        BigDecimal monthlyTotal = expenseRepository.getMonthlyTotal(userId, now.getMonthValue(), now.getYear());
        BigDecimal allTimeTotal = expenseRepository.getTotalByUserId(userId);
        Long transactionCount = expenseRepository.countByUserId(userId);

        // Build last 6 months data
        Map<String, BigDecimal> monthlyBreakdown = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            BigDecimal total = expenseRepository.getMonthlyTotal(userId, month.getMonthValue(), month.getYear());
            monthlyBreakdown.put(month.format(formatter), total != null ? total : BigDecimal.ZERO);
        }

        // Find largest expense
        List<Expense> all = expenseRepository.findByUserIdOrderByDateDesc(userId);
        BigDecimal maxExpense = all.stream()
                .map(Expense::getAmount)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("monthlyTotal", monthlyTotal != null ? monthlyTotal : BigDecimal.ZERO);
        summary.put("allTimeTotal", allTimeTotal != null ? allTimeTotal : BigDecimal.ZERO);
        summary.put("transactionCount", transactionCount);
        summary.put("largestExpense", maxExpense);
        summary.put("monthlyBreakdown", monthlyBreakdown);

        return summary;
    }

    private ExpenseResponse toResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .date(expense.getDate())
                .description(expense.getDescription())
                .categoryId(expense.getCategory() != null ? expense.getCategory().getId() : null)
                .categoryName(expense.getCategory() != null ? expense.getCategory().getName() : null)
                .categoryColor(expense.getCategory() != null ? expense.getCategory().getColor() : null)
                .userId(expense.getUser().getId())
                .createdAt(expense.getCreatedAt())
                .build();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}

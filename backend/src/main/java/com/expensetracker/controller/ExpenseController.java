package com.expensetracker.controller;

import com.expensetracker.dto.ExpenseRequest;
import com.expensetracker.dto.ExpenseResponse;
import com.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search
    ) {
        String email = userDetails.getUsername();
        List<ExpenseResponse> expenses;

        if (search != null && !search.isBlank()) {
            expenses = expenseService.searchExpenses(search, email);
        } else if (categoryId != null) {
            expenses = expenseService.getExpensesByCategory(categoryId, email);
        } else {
            expenses = expenseService.getAllExpenses(email);
        }

        return ResponseEntity.ok(expenses);
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> addExpense(
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ExpenseResponse response = expenseService.addExpense(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        expenseService.deleteExpense(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(expenseService.getSummary(userDetails.getUsername()));
    }
}

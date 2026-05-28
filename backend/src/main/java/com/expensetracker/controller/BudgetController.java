package com.expensetracker.controller;

import com.expensetracker.dto.BudgetRequest;
import com.expensetracker.dto.BudgetResponse;
import com.expensetracker.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getBudgets(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(budgetService.getBudgets(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> setBudget(
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BudgetResponse budget = budgetService.setBudget(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(budget);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        budgetService.deleteBudget(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}

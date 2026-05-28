package com.expensetracker.controller;

import com.expensetracker.dto.RecurringExpenseRequest;
import com.expensetracker.dto.RecurringExpenseResponse;
import com.expensetracker.service.RecurringExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
@RequiredArgsConstructor
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    @GetMapping
    public ResponseEntity<List<RecurringExpenseResponse>> getRecurringExpenses(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(recurringExpenseService.getRecurringExpenses(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<RecurringExpenseResponse> createRecurringExpense(
            @Valid @RequestBody RecurringExpenseRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RecurringExpenseResponse created = recurringExpenseService.createRecurringExpense(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<RecurringExpenseResponse> toggleRecurringExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        RecurringExpenseResponse updated = recurringExpenseService.toggleRecurringExpense(id, userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        recurringExpenseService.deleteRecurringExpense(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}

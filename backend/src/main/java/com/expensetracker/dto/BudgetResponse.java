package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetResponse {
    private Long id;
    private BigDecimal amount;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
    private BigDecimal currentSpending;
    private double progressPercentage; // spending/amount * 100
}

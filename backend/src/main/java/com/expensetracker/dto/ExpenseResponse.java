package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExpenseResponse {
    private Long id;
    private String title;
    private BigDecimal amount;
    private LocalDate date;
    private String description;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
    private Long userId;
    private LocalDateTime createdAt;
}

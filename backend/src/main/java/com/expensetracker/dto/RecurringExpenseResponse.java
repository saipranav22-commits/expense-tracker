package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringExpenseResponse {
    private Long id;
    private String title;
    private BigDecimal amount;
    private String frequency;
    private LocalDate startDate;
    private LocalDate lastProcessedDate;
    private LocalDate nextDueDate;
    private boolean active;
    private String description;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
}

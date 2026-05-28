package com.expensetracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RecurringExpenseRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @NotBlank(message = "Frequency is required")
    private String frequency; // DAILY, WEEKLY, MONTHLY, YEARLY

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private String description;

    private Long categoryId;
}

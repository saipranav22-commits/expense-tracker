package com.expensetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsightResponse {
    private String type; // INFO, WARNING, SUCCESS
    private String title;
    private String description;
    private String impactValue; // e.g. "₹1,240.00" or "23%"
}

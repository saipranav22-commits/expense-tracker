package com.expensetracker.controller;

import com.expensetracker.dto.InsightResponse;
import com.expensetracker.service.InsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/expenses/insights")
@RequiredArgsConstructor
public class InsightController {

    private final InsightService insightService;

    @GetMapping
    public ResponseEntity<List<InsightResponse>> getInsights(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(insightService.generateInsights(userDetails.getUsername()));
    }
}

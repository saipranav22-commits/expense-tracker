package com.expensetracker.controller;

import com.expensetracker.dto.CategoryRequest;
import com.expensetracker.model.Category;
import com.expensetracker.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(categoryService.getAllCategories(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<Category> addCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Category category = categoryService.addCategory(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        categoryService.deleteCategory(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}

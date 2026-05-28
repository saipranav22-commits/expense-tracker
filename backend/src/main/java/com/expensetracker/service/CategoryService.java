package com.expensetracker.service;

import com.expensetracker.dto.CategoryRequest;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<Category> getAllCategories(String email) {
        User user = getUser(email);
        return categoryRepository.findByUserId(user.getId());
    }

    public Category addCategory(CategoryRequest request, String email) {
        User user = getUser(email);

        if (categoryRepository.existsByNameAndUserId(request.getName(), user.getId())) {
            throw new RuntimeException("Category '" + request.getName() + "' already exists.");
        }

        Category category = Category.builder()
                .name(request.getName())
                .color(request.getColor() != null ? request.getColor() : "#6c63ff")
                .user(user)
                .build();

        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id, String email) {
        User user = getUser(email);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        categoryRepository.deleteById(id);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}

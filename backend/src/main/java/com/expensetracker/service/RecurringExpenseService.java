package com.expensetracker.service;

import com.expensetracker.dto.RecurringExpenseRequest;
import com.expensetracker.dto.RecurringExpenseResponse;
import com.expensetracker.model.*;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.RecurringExpenseRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<RecurringExpenseResponse> getRecurringExpenses(String email) {
        User user = getUser(email);
        return recurringExpenseRepository.findByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RecurringExpenseResponse createRecurringExpense(RecurringExpenseRequest request, String email) {
        User user = getUser(email);
        Category category = null;

        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            if (!category.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Access denied: You don't own this category");
            }
        }

        Frequency freq;
        try {
            freq = Frequency.valueOf(request.getFrequency().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid frequency. Must be DAILY, WEEKLY, MONTHLY, or YEARLY.");
        }

        // Initialize template
        RecurringExpense template = RecurringExpense.builder()
                .title(request.getTitle())
                .amount(request.getAmount())
                .frequency(freq)
                .startDate(request.getStartDate())
                .nextDueDate(request.getStartDate()) // The first due date is the start date
                .description(request.getDescription())
                .category(category)
                .user(user)
                .build();

        RecurringExpense saved = recurringExpenseRepository.save(template);
        
        // Immediately process to catch up if startDate is in the past or today
        processSingleRecurringExpense(saved, LocalDate.now());

        return toResponse(saved);
    }

    @Transactional
    public RecurringExpenseResponse toggleRecurringExpense(Long id, String email) {
        User user = getUser(email);
        RecurringExpense recurring = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring expense not found"));

        if (!recurring.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        recurring.setActive(!recurring.isActive());
        
        // If toggled back to active, instantly process to check if we missed any occurrences!
        if (recurring.isActive()) {
            processSingleRecurringExpense(recurring, LocalDate.now());
        }

        RecurringExpense saved = recurringExpenseRepository.save(recurring);
        return toResponse(saved);
    }

    @Transactional
    public void deleteRecurringExpense(Long id, String email) {
        User user = getUser(email);
        RecurringExpense recurring = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurring expense not found"));

        if (!recurring.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        recurringExpenseRepository.deleteById(id);
    }

    // Run automatically every day at 1:00 AM
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void runScheduledRecurringExpenses() {
        log.info("Starting scheduled recurring expenses processing...");
        processAllActiveRecurringExpenses();
    }

    // Also run on application startup to ensure no dates were missed during downtime
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onApplicationStart() {
        log.info("System boot: processing active recurring expenses for downtime catchup...");
        processAllActiveRecurringExpenses();
    }

    private void processAllActiveRecurringExpenses() {
        LocalDate today = LocalDate.now();
        List<RecurringExpense> activeDue = recurringExpenseRepository
                .findByActiveTrueAndNextDueDateLessThanEqual(today);

        log.info("Found {} active recurring expenses due for processing.", activeDue.size());
        for (RecurringExpense recurring : activeDue) {
            processSingleRecurringExpense(recurring, today);
        }
    }

    private void processSingleRecurringExpense(RecurringExpense recurring, LocalDate today) {
        boolean modified = false;
        
        // Catch-up loop: generate all missing past transactions up to today
        while (recurring.isActive() && !recurring.getNextDueDate().isAfter(today)) {
            LocalDate dueDate = recurring.getNextDueDate();

            Expense generated = Expense.builder()
                    .title(recurring.getTitle())
                    .amount(recurring.getAmount())
                    .date(dueDate)
                    .description(recurring.getDescription() != null ? recurring.getDescription() + " (Recurring)" : "Recurring transaction")
                    .category(recurring.getCategory())
                    .user(recurring.getUser())
                    .build();

            expenseRepository.save(generated);
            log.info("Generated recurring expense '{}' for date {}.", recurring.getTitle(), dueDate);

            recurring.setLastProcessedDate(dueDate);
            recurring.setNextDueDate(calculateNextDueDate(dueDate, recurring.getFrequency()));
            modified = true;
        }

        if (modified) {
            recurringExpenseRepository.save(recurring);
        }
    }

    private LocalDate calculateNextDueDate(LocalDate current, Frequency frequency) {
        switch (frequency) {
            case DAILY:
                return current.plusDays(1);
            case WEEKLY:
                return current.plusWeeks(1);
            case MONTHLY:
                return current.plusMonths(1);
            case YEARLY:
                return current.plusYears(1);
            default:
                throw new IllegalArgumentException("Unknown frequency: " + frequency);
        }
    }

    private RecurringExpenseResponse toResponse(RecurringExpense entity) {
        return RecurringExpenseResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .amount(entity.getAmount())
                .frequency(entity.getFrequency().name())
                .startDate(entity.getStartDate())
                .lastProcessedDate(entity.getLastProcessedDate())
                .nextDueDate(entity.getNextDueDate())
                .active(entity.isActive())
                .description(entity.getDescription())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .categoryColor(entity.getCategory() != null ? entity.getCategory().getColor() : null)
                .build();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}

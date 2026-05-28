package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserIdOrderByDateDesc(Long userId);

    List<Expense> findByUserIdAndCategoryIdOrderByDateDesc(Long userId, Long categoryId);

    List<Expense> findByUserIdAndTitleContainingIgnoreCaseOrderByDateDesc(Long userId, String title);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.user.id = :userId " +
            "AND MONTH(e.date) = :month " +
            "AND YEAR(e.date) = :year")
    BigDecimal getMonthlyTotal(@Param("userId") Long userId,
                               @Param("month") int month,
                               @Param("year") int year);

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId " +
            "AND e.date BETWEEN :startDate AND :endDate ORDER BY e.date DESC")
    List<Expense> findByUserIdAndDateBetween(@Param("userId") Long userId,
                                              @Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.user.id = :userId")
    BigDecimal getTotalByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.user.id = :userId")
    Long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
            "WHERE e.user.id = :userId " +
            "AND e.category.id = :categoryId " +
            "AND MONTH(e.date) = :month " +
            "AND YEAR(e.date) = :year")
    BigDecimal getMonthlyTotalByCategory(@Param("userId") Long userId,
                                         @Param("categoryId") Long categoryId,
                                         @Param("month") int month,
                                         @Param("year") int year);
}

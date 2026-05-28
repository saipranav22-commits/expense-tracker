package com.expensetracker.service;

import com.expensetracker.model.*;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public String generateCsv(String email) {
        User user = getUser(email);
        List<Expense> expenses = expenseRepository.findByUserIdOrderByDateDesc(user.getId());

        StringBuilder csv = new StringBuilder();
        // CSV Header
        csv.append("ID,Title,Amount (INR),Date,Category,Description,Created At\n");

        for (Expense e : expenses) {
            csv.append(e.getId()).append(",")
               .append(escapeCsvField(e.getTitle())).append(",")
               .append(e.getAmount()).append(",")
               .append(e.getDate()).append(",")
               .append(escapeCsvField(e.getCategory() != null ? e.getCategory().getName() : "Uncategorized")).append(",")
               .append(escapeCsvField(e.getDescription())).append(",")
               .append(e.getCreatedAt()).append("\n");
        }
        return csv.toString();
    }

    public byte[] generatePdf(String email) {
        User user = getUser(email);
        List<Expense> expenses = expenseRepository.findByUserIdOrderByDateDesc(user.getId());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Set up fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(108, 99, 255));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY);
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font textFontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);

            // Document Header
            Paragraph title = new Paragraph("💸 Expense Tracker Report", titleFont);
            title.setAlignment(Element.ALIGN_LEFT);
            document.add(title);

            Paragraph subtitle = new Paragraph("Generated for " + user.getName() + " (" + user.getEmail() + ") on " + LocalDate.now(), subTitleFont);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Financial Summary Block
            BigDecimal totalAmount = BigDecimal.ZERO;
            for (Expense e : expenses) {
                totalAmount = totalAmount.add(e.getAmount());
            }

            Paragraph summaryHeading = new Paragraph("Financial Summary", headingFont);
            summaryHeading.setSpacingBefore(10);
            summaryHeading.setSpacingAfter(10);
            document.add(summaryHeading);

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(20);

            addSummaryCell(summaryTable, "Total Transactions Recorded", String.valueOf(expenses.size()), textFont, textFontBold);
            addSummaryCell(summaryTable, "All-Time Total Spending", formatCurrency(totalAmount), textFont, textFontBold);
            document.add(summaryTable);

            // Expense Table
            Paragraph detailsHeading = new Paragraph("Detailed Transactions List", headingFont);
            detailsHeading.setSpacingBefore(10);
            detailsHeading.setSpacingAfter(10);
            document.add(detailsHeading);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{30f, 15f, 15f, 15f, 25f}); // Column relative weights

            // Table Headers
            addTableHeader(table, "Expense Title", headerFont);
            addTableHeader(table, "Category", headerFont);
            addTableHeader(table, "Date", headerFont);
            addTableHeader(table, "Amount", headerFont);
            addTableHeader(table, "Description", headerFont);

            // Populate rows
            boolean alternate = false;
            Color altRowColor = new Color(245, 245, 250);
            for (Expense e : expenses) {
                Color bg = alternate ? altRowColor : Color.WHITE;
                addTableCell(table, e.getTitle(), textFont, bg);
                addTableCell(table, e.getCategory() != null ? e.getCategory().getName() : "Uncategorized", textFont, bg);
                addTableCell(table, e.getDate().toString(), textFont, bg);
                addTableCell(table, formatCurrency(e.getAmount()), textFontBold, bg);
                addTableCell(table, e.getDescription() != null ? e.getDescription() : "", textFont, bg);
                alternate = !alternate;
            }

            document.add(table);
            document.close();

        } catch (Exception e) {
            throw new RuntimeException("Error occurred while generating PDF report", e);
        }

        return out.toByteArray();
    }

    private void addTableHeader(PdfPTable table, String headerTitle, Font font) {
        PdfPCell header = new PdfPCell();
        header.setBackgroundColor(new Color(15, 22, 41)); // sleek dark blue
        header.setBorderWidth(1);
        header.setPadding(8);
        header.setPhrase(new Phrase(headerTitle, font));
        table.addCell(header);
    }

    private void addTableCell(PdfPTable table, String value, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setPadding(6);
        cell.setBackgroundColor(bgColor);
        cell.setBorderWidth(0.5f);
        cell.setBorderColor(new Color(230, 230, 230));
        table.addCell(cell);
    }

    private void addSummaryCell(PdfPTable table, String label, String value, Font font, Font valFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setPadding(8);
        labelCell.setBackgroundColor(new Color(245, 245, 245));
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valFont));
        valueCell.setPadding(8);
        table.addCell(valueCell);
    }

    private String escapeCsvField(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String formatCurrency(BigDecimal amount) {
        NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return format.format(amount);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}

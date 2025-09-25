package com.x.pelegant.service;

import com.x.pelegant.entity.Company;
import com.x.pelegant.service.industry.IndustryClassifier;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service to import bank data from Excel file into the company collection
 */
@Service
public class ExcelImportService {

    @Autowired
    private MongoTemplate mongoTemplate;

    private final IndustryClassifier classifier = IndustryClassifier.defaultClassifier();

    public void importCompaniesFromExcel(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            Workbook workbook = new XSSFWorkbook(inputStream);
            Sheet sheet = workbook.getSheet("Hong Kong");
            if (sheet == null) {
                sheet = workbook.getSheetAt(0); // fallback to first sheet
            }

            // 获取已有 companyId 和 companyNameLower，避免重复导入
            List<String> existingCompanyIds = mongoTemplate.findDistinct(
                    Query.query(Criteria.where("companyId").exists(true)),
                    "companyId",
                    "company",
                    String.class
            );
            List<String> existingCompanyNamesLower = mongoTemplate.findDistinct(
                    Query.query(Criteria.where("companyNameLower").exists(true)),
                    "companyNameLower",
                    "company",
                    String.class
            );

            Set<String> importedCompanyNames = new HashSet<>(); // Excel 内部去重

            List<Company> companies = new ArrayList<>();
            int nextCompanyIdNumber = getNextCompanyIdNumber(existingCompanyIds);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isEmptyRow(row) || isInformationalRow(row)) continue;

                String name = getCellStringValue(row.getCell(0));
                if (name == null || name.trim().isEmpty()) continue;

                String nameLower = name.trim().toLowerCase();

                // Excel 内部重复跳过
                if (importedCompanyNames.contains(nameLower)) continue;

                // MongoDB 已有数据跳过，保留原数据
                if (existingCompanyNamesLower.contains(nameLower)) continue;

                importedCompanyNames.add(nameLower);

                String incorporatedInHK = getCellStringValue(row.getCell(1));
                String incorporatedOutsideHK = getCellStringValue(row.getCell(2));
                String headquarter = getCellStringValue(row.getCell(3));
                String continent = getCellStringValue(row.getCell(4));
                String virtualBanks = getCellStringValue(row.getCell(5));
                String privateBanks = getCellStringValue(row.getCell(6));
                String logoImage = getCellStringValue(row.getCell(8));
                String description = getCellStringValue(row.getCell(9));



                Company company = new Company();
                company.setCompanyId("COM" + nextCompanyIdNumber++);
                company.setCompanyName(name.trim());
                company.setCompanyNameLower(nameLower);
                company.setCompanyType(
                        incorporatedInHK != null && !incorporatedInHK.isEmpty() ? "Hong Kong Incorporated" :
                                incorporatedOutsideHK != null && !incorporatedOutsideHK.isEmpty() ? "Foreign Incorporated" :
                                        "Bank"
                );
                company.setCompanyAddress(headquarter != null && !headquarter.isEmpty() ? headquarter : "Unknown");
                if (description== null){
                    description = "Unknown";
                }else {
                    description = getCellStringValue(row.getCell(9));;
                }

                if ("✓".equals(virtualBanks)) {
                    description = "Virtual Bank";
                } else if ("✓".equals(privateBanks)) {
                    description = "Private Bank";
                }
                company.setCompanyDescription(description);
                company.setLogoImage(logoImage != null && !logoImage.trim().isEmpty() ? logoImage.trim() : "");
                // —— 行业分类：本批为银行 → 金融优先；未命中用“原有行业”兜底 ——
                // oldIndustry：如果你之前已经给 company.setIndustry(...) 赋过旧值就取；没有就为 null
                String oldIndustry = company.getIndustry();
                IndustryClassifier.IndustryResult fallback =
                        (oldIndustry == null || oldIndustry.trim().isEmpty())
                                ? null
                                : new IndustryClassifier.IndustryResult(null, oldIndustry, null);

// 使用分类器进行名称和描述匹配
                IndustryClassifier.IndustryResult ind = classifier.classify(company);

// 如果没有找到匹配，使用 fallback
                if (ind == null || "Unknown".equals(ind.getSector())) {
                    ind = fallback != null ? fallback : new IndustryClassifier.IndustryResult("Unknown", null, null);
                }

// 更新公司信息，优先使用匹配结果
                try {
                    company.setSector(ind.getSector());  // 设置主行业
                } catch (NoSuchMethodError | Exception ignore) { /* 没有该字段时忽略 */ }

                try {
                    company.setIndustryCategory(ind.getIndustry());  // 设置次级行业
                } catch (NoSuchMethodError | Exception ignore) { /* 没有该字段时忽略 */ }

                try {
                    company.setSubIndustry(ind.getSubIndustry());  // 设置子行业
                } catch (NoSuchMethodError | Exception ignore) { /* 没有该字段时忽略 */ }

// 兼容旧前端：以扁平化结果呈现行业
                company.setIndustry(ind.flat());



// 其他通用属性
                company.setCompanySize(null);
                company.setCompanyWebsite(null);
                company.setContactPhone("00000000000");
                company.setContactPerson("Unknown");
                company.setContactEmail("unknown@bank.com");
                company.setStatus("active");
                company.setCreatedAt(LocalDateTime.now());
                company.setUpdatedAt(LocalDateTime.now());


                companies.add(company);
            }

            if (!companies.isEmpty()) {
                mongoTemplate.insertAll(companies);
            }

            workbook.close();
        }
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) {
            return null;
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == (long) numericValue) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }

    private boolean isEmptyRow(Row row) {
        if (row == null) {
            return true;
        }
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellStringValue(cell);
                if (value != null && !value.trim().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }

    private boolean isInformationalRow(Row row) {
        String name = getCellStringValue(row.getCell(0));
        return name != null && (
                name.startsWith("*") ||
                        name.startsWith("1.") ||
                        name.startsWith("2.") ||
                        name.startsWith("3.") ||
                        name.startsWith("4.") ||
                        name.startsWith("5.") ||
                        name.startsWith("6.") ||
                        name.startsWith("7.") ||
                        name.startsWith("8.") ||
                        name.contains("Licensed Banks in Hong Kong") ||
                        name.contains("At 31 December 2023")
        );
    }

    private int getNextCompanyIdNumber(List<String> existingCompanyIds) {
        int maxNumber = 9; // 基于 COM9 的初始值
        for (String id : existingCompanyIds) {
            if (id.startsWith("COM")) {
                try {
                    int number = Integer.parseInt(id.substring(3));
                    maxNumber = Math.max(maxNumber, number);
                } catch (NumberFormatException e) {
                    // 忽略非数字格式的ID
                }
            }
        }
        return maxNumber + 1;
    }
}

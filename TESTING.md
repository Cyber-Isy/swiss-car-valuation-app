# Testing Guide

Comprehensive testing documentation for the Car Valuation App.

## 🚀 Quick Start

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## ✅ Current Test Coverage

### **1. Perplexity Helper Functions** ([perplexity-helpers.test.ts](src/lib/perplexity-helpers.test.ts))
- ✅ Price extraction (CHF/Fr. formats, Swiss number formatting)
- ✅ Mileage extraction (km formats)
- ✅ Year extraction (1990-2025 range)
- ✅ Outlier removal (IQR statistical method)
- ✅ Standard deviation calculation

### **2. Perplexity Integration** ([perplexity.test.ts](src/lib/perplexity.test.ts))
- ✅ Search API → Analysis API flow
- ✅ Fallback to Sonar when no results
- ✅ Outlier detection and removal
- ✅ Confidence calculation (based on variance)
- ✅ Data validation (year, mileage ranges)
- ✅ Partial extraction with fallbacks
- ✅ Edge cases (no results, API errors)

### **3. API Routes** ([route.test.ts](src/app/api/valuations/route.test.ts))
- ✅ POST /api/valuations endpoint
- ✅ Validation (required fields, email, year)
- ✅ AI pricing integration
- ✅ Graceful failure handling

### **4. Form Validation** ([validation.test.ts](src/lib/validation.test.ts))
- ✅ Basic vehicle data validation
- ✅ Contact information validation
- ✅ Business rules (age/mileage limits)
- ✅ Edge cases (current year, zero mileage)

## 📝 Recommended Tests to Add

### **Priority 1: Critical Business Logic**

#### **A. Admin Status Updates**
```typescript
// src/app/admin/valuations/[id]/actions.test.ts
describe('Admin Actions', () => {
  it('should update status to ACCEPTED', async () => {
    // Test status transitions
  })

  it('should prevent invalid status transitions', async () => {
    // PENDING → REJECTED should work
    // ACCEPTED → PENDING should fail
  })

  it('should archive old valuations', async () => {
    // Test archival logic
  })

  it('should send notification email on status change', async () => {
    // Mock Resend and verify email sent
  })
})
```

#### **B. Image Upload**
```typescript
// src/lib/supabase.test.ts
describe('Image Upload', () => {
  it('should upload image to Supabase', async () => {
    // Mock Supabase upload
  })

  it('should validate image size (max 5MB)', async () => {
    // Test size validation
  })

  it('should validate image type (jpg, png only)', async () => {
    // Test file type validation
  })

  it('should generate unique filenames', async () => {
    // Prevent filename collisions
  })

  it('should handle upload failures gracefully', async () => {
    // Test error handling
  })
})
```

#### **C. Email Notifications**
```typescript
// src/lib/email.test.ts
describe('Email Notifications', () => {
  it('should send confirmation email on submission', async () => {
    // Test Resend integration
  })

  it('should send status update emails', async () => {
    // Test status change notifications
  })

  it('should include valuation details in email', async () => {
    // Verify email content
  })

  it('should handle email failures gracefully', async () => {
    // Don't fail submission if email fails
  })
})
```

### **Priority 2: Database & Data Integrity**

#### **D. Prisma Queries**
```typescript
// src/lib/db.test.ts
describe('Database Queries', () => {
  it('should fetch pending valuations', async () => {
    // Test admin dashboard query
  })

  it('should filter by status', async () => {
    // Test status filtering
  })

  it('should search by brand/model', async () => {
    // Test search functionality
  })

  it('should handle pagination', async () => {
    // Test pagination logic
  })

  it('should soft delete (archive) valuations', async () => {
    // Test archival (not hard delete)
  })
})
```

#### **E. Data Consistency**
```typescript
// src/lib/data-integrity.test.ts
describe('Data Integrity', () => {
  it('should prevent duplicate submissions (same vehicle + contact)', async () => {
    // Test duplicate detection
  })

  it('should validate price ranges (AI vs final)', async () => {
    // Final price should be reasonable vs AI estimate
  })

  it('should track audit trail (status changes)', async () => {
    // Verify updatedAt changes on status update
  })
})
```

### **Priority 3: UI & User Experience**

#### **F. Form Component Tests**
```typescript
// src/components/ValuationForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

describe('ValuationForm', () => {
  it('should show Tier 1 fields by default', () => {
    render(<ValuationForm />)
    expect(screen.getByLabelText(/Marke/i)).toBeInTheDocument()
  })

  it('should expand to Tier 2 on button click', async () => {
    render(<ValuationForm />)
    fireEvent.click(screen.getByText(/Mehr Details/i))
    await waitFor(() => {
      expect(screen.getByLabelText(/Antrieb/i)).toBeVisible()
    })
  })

  it('should validate required fields on submit', async () => {
    render(<ValuationForm />)
    fireEvent.click(screen.getByText(/Bewertung anfordern/i))
    await waitFor(() => {
      expect(screen.getByText(/Marke ist erforderlich/i)).toBeInTheDocument()
    })
  })

  it('should show success page after submission', async () => {
    // Mock successful API call
    // Submit form
    // Verify redirect to /success
  })
})
```

#### **G. Admin Dashboard Tests**
```typescript
// src/app/admin/page.test.tsx
describe('Admin Dashboard', () => {
  it('should display pending valuations', async () => {
    // Mock Prisma query
    // Render dashboard
    // Verify valuations displayed
  })

  it('should filter by status', async () => {
    // Test status filter dropdown
  })

  it('should open valuation details modal', async () => {
    // Click on valuation
    // Verify modal opens with details
  })
})
```

### **Priority 4: Edge Cases & Error Handling**

#### **H. Error Scenarios**
```typescript
// src/lib/error-handling.test.ts
describe('Error Handling', () => {
  it('should handle database connection errors', async () => {
    // Mock Prisma connection error
    // Verify graceful failure
  })

  it('should handle Perplexity API rate limits', async () => {
    // Mock 429 response
    // Verify retry logic or graceful degradation
  })

  it('should handle Supabase storage errors', async () => {
    // Mock storage failure
    // Verify form submission still works (images optional)
  })

  it('should handle network timeouts', async () => {
    // Mock timeout
    // Verify proper error message to user
  })
})
```

#### **I. Security Tests**
```typescript
// src/lib/security.test.ts
describe('Security', () => {
  it('should sanitize user input (XSS prevention)', async () => {
    // Test HTML injection in notes field
  })

  it('should validate file uploads (prevent malicious files)', async () => {
    // Test .exe, .sh files are rejected
  })

  it('should require authentication for admin routes', async () => {
    // Test /admin requires NextAuth session
  })

  it('should prevent SQL injection in search', async () => {
    // Test Prisma properly escapes input
  })
})
```

## 🎯 Test Writing Best Practices

### **1. Arrange-Act-Assert Pattern**
```typescript
it('should calculate purchase price correctly', () => {
  // Arrange
  const marketValue = 10000

  // Act
  const purchasePrice = marketValue * 0.85

  // Assert
  expect(purchasePrice).toBe(8500)
})
```

### **2. Mock External Dependencies**
```typescript
import { vi } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    valuation: {
      create: vi.fn(),
      findMany: vi.fn()
    }
  }
}))
```

### **3. Test One Thing Per Test**
```typescript
// ✅ Good - tests one behavior
it('should reject negative mileage', () => {
  const result = validate({ mileage: -1000 })
  expect(result.valid).toBe(false)
})

// ❌ Bad - tests multiple behaviors
it('should validate form', () => {
  expect(validate({ mileage: -1000 }).valid).toBe(false)
  expect(validate({ year: 1989 }).valid).toBe(false)
  expect(validate({ email: 'bad' }).valid).toBe(false)
})
```

### **4. Use Descriptive Test Names**
```typescript
// ✅ Good
it('should reject vehicles older than 10 years')

// ❌ Bad
it('should work')
```

## 📊 Coverage Goals

| Component | Current | Target |
|-----------|---------|--------|
| Perplexity Helpers | 95% | 95% ✅ |
| Perplexity Integration | 85% | 90% |
| API Routes | 60% | 90% |
| Form Validation | 70% | 95% |
| Admin Actions | 0% | 80% |
| Database | 0% | 75% |
| Email | 0% | 80% |
| Image Upload | 0% | 85% |

## 🔧 Running Specific Tests

```bash
# Run only Perplexity tests
npm test perplexity

# Run only validation tests
npm test validation

# Run only API tests
npm test route

# Watch mode for development
npm test -- --watch

# Run with coverage
npm run test:coverage
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Test Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎓 Next Steps

1. **Implement Priority 1 Tests** (Admin, Email, Images)
2. **Set up CI/CD** to run tests on every commit
3. **Add E2E tests** with Playwright for full user flows
4. **Monitor coverage** and aim for 80%+ overall coverage

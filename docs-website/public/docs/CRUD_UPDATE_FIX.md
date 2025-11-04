# CRUD Update Functions Fix

## Issue

**Error:** `psycopg2.errors.NotNullViolation: null value in column "full_name" of relation "users" violates not-null constraint`

**Cause:** When calling `PUT /users/1?role_id=2`, the update function was setting ALL fields (full_name, email, phone) to `None`, even when they weren't provided in the request.

**Example of the problem:**
```python
# Request: PUT /users/1?role_id=2
# Only role_id should be updated, but the function was doing:
UPDATE users SET 
    full_name=None,    # ❌ Causing NOT NULL violation
    email=None,        # ❌ Should not be changed
    phone=None,        # ❌ Should not be changed
    role_id=2          # ✅ Only this should be updated
WHERE users.id = 1
```

---

## Solution

Modified all update functions in `backend/app/db/crud.py` to **only update fields that are actually provided (not None)**.

### Changed Functions

1. `update_user()`
2. `update_staff()`
3. `update_patient()`
4. `update_service_request()`
5. `update_assignment()`

### The Fix

**Before:**
```python
def update_user(db: Session, user_id: int, **kwargs):
    user = get_user(db, user_id)
    if not user:
        return None
    for key, value in kwargs.items():
        if hasattr(user, key):
            setattr(user, key, value)  # ❌ Sets None values
    db.commit()
    db.refresh(user)
    return user
```

**After:**
```python
def update_user(db: Session, user_id: int, **kwargs):
    user = get_user(db, user_id)
    if not user:
        return None
    for key, value in kwargs.items():
        # Only update fields that are provided (not None)
        if hasattr(user, key) and value is not None:  # ✅ Skip None values
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
```

---

## How It Works Now

### Example 1: Update Only Role
```bash
PUT /users/1?role_id=2
```
- ✅ Only `role_id` is updated to `2`
- ✅ `full_name`, `email`, `phone` remain unchanged

### Example 2: Update Multiple Fields
```bash
PUT /users/1?full_name=John&email=john@example.com
```
- ✅ `full_name` is updated to "John"
- ✅ `email` is updated to "john@example.com"
- ✅ `role_id` and `phone` remain unchanged

### Example 3: Update All Fields
```bash
PUT /users/1?full_name=Jane&email=jane@example.com&phone=555-1234&role_id=3
```
- ✅ All provided fields are updated
- ✅ No fields set to None

---

## Testing

### Test the Fix

```bash
# 1. Update only role_id (should work now)
curl -X PUT "https://api.hremsoftconsulting.com/users/1?role_id=2" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Success (200), only role_id updated

# 2. Update only email
curl -X PUT "https://api.hremsoftconsulting.com/users/1?email=newemail@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Success (200), only email updated

# 3. Update multiple fields
curl -X PUT "https://api.hremsoftconsulting.com/users/1?full_name=Updated%20Name&phone=555-9999" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Success (200), full_name and phone updated
```

---

## Impact

### ✅ Fixed
- Partial updates now work correctly
- No more NOT NULL constraint violations
- Fields not provided in request remain unchanged

### ⚠️ Important Note
If you want to explicitly set a field to `None` (NULL in database), you would need to modify the API to accept a special value or use a different mechanism, as `None` is now treated as "don't update this field".

For most use cases, this is the desired behavior - you only update what you provide.

---

## Files Modified

- ✅ `backend/app/db/crud.py` - Fixed 5 update functions

---

**Status:** ✅ FIXED

**Date:** November 4, 2025

**Error No Longer Occurs:** The NOT NULL violation error is now resolved.


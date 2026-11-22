# CampusSignal Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Single-Student Ownership**: Every document under `/users/{userId}` and `/users/{userId}/announcements/{announcementId}` belongs solely to `request.auth.uid == userId`, where `request.auth.token.email_verified == true`.
2. **Parent Existence (Master Gate)**: An announcement under `/users/{userId}/announcements/{announcementId}` cannot be created or updated unless the parent `/users/{userId}` profile exists and its `uid` matches `request.auth.uid`.
3. **Immutability & Server Timestamps**: `ownerId`, `id`, and `createdAt` are immutable after creation. Both `createdAt` (on create) and `updatedAt` (on create/update) must equal `request.time`.
4. **Strict Key & Size Bounds**: Extra shadow/ghost keys are rejected via `keys().hasAll(...) && keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on action-based updates. All strings and arrays are strictly bounded to prevent resource poisoning and stay well below Firestore's 1 MiB document limit.
5. **Zero Duplicate Records**: Calendar events are derived directly from verified `announcements` documents rather than duplicated into separate collections.

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Unauthenticated Read/Write**: `request.auth == null` attempting to list or create `/users/uid1/announcements/ann1`.
2. **Unverified Email Write**: `request.auth.token.email_verified == false` attempting to create `/users/uid1`.
3. **Cross-User Read (`get`/`list`)**: Authenticated `uid2` attempting to read or list `/users/uid1/announcements`.
4. **Cross-User Write**: Authenticated `uid2` attempting to create `/users/uid1/announcements/ann1` with `ownerId: "uid1"`.
5. **Owner Spoofing**: Authenticated `uid1` creating `/users/uid1/announcements/ann1` with `ownerId: "uid2"`.
6. **Orphaned Announcement**: Authenticated `uid1` creating `/users/uid1/announcements/ann1` before `/users/uid1` exists.
7. **Shadow / Ghost Field Injection**: Creating an announcement with an undeclared field such as `isAdminApproved: true`.
8. **Invalid Document ID Poisoning**: Creating `/users/uid1/announcements/invalid$id!withSpaces` or ID > 128 chars.
9. **Client-Spoofed Timestamp**: Creating an announcement with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`.
10. **Immutable Field Tampering**: Updating an existing announcement's `ownerId` or `createdAt`.
11. **Oversized Payload / String Poisoning**: Submitting a `title` > 200 chars, `shortSummary` > 1500 chars, or `deadlines` array > 25 items.
12. **Out-of-Enum Category/Priority**: Submitting `category: "FakeCategory"` or `priority: "Critical"`.

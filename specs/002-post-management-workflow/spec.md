# Feature Specification: Post Management Workflow

**Feature Branch**: `002-post-management-workflow`
**Created**: 2026-04-22
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save Post as Draft (Priority: P1)

A user creates a new post (via the Generate Post feature), reviews and optionally edits it, then clicks "Save as Draft". The post is persisted with the user's identity and a Draft status, and immediately appears in the user's Draft tab.

**Why this priority**: The draft state is the entry point for all post lifecycle transitions. Without it, no other action (Schedule, Publish, Reject) is possible.

**Independent Test**: Can be tested by generating a post, clicking "Save as Draft", and verifying it appears in the Draft tab attributed to the logged-in user.

**Acceptance Scenarios**:

1. **Given** a logged-in user has generated a post preview, **When** they click "Save as Draft", **Then** the post is stored with status `Draft`, the logged-in user's ID, and appears in the Draft tab.
2. **Given** a draft post exists, **When** any other user accesses the system, **Then** they cannot view or interact with that post.
3. **Given** a user saves a draft, **When** they refresh the page, **Then** the post is still present in the Draft tab with all original content intact.

---

### User Story 2 - Edit a Draft Post (Priority: P2)

A user opens an existing draft, modifies the topic or content, and saves the changes. The post status remains `Draft` and user ownership is unchanged.

**Why this priority**: Editing is a core iterative workflow — users need to refine content before publishing. The status must not change on edit.

**Independent Test**: Can be tested by editing a draft's content, saving, and verifying status is still `Draft` and changes persist.

**Acceptance Scenarios**:

1. **Given** a draft post owned by the logged-in user, **When** they edit the topic or content and save, **Then** the post remains in `Draft` status with updated content and the same owner.
2. **Given** a user edits a draft, **When** they save, **Then** the post's owner ID is not modified.
3. **Given** a user edits content that exceeds the 3000-character limit, **When** they attempt to save, **Then** the save is blocked and an error is displayed.

---

### User Story 3 - Publish a Draft Post Immediately (Priority: P2)

A user selects "Publish Now" on a draft post. The system publishes it to LinkedIn, changes the status to `Published`, and the post moves from the Draft tab to the Published tab.

**Why this priority**: Immediate publishing is the primary content-delivery action and delivers direct business value.

**Independent Test**: Can be tested by clicking "Publish Now" on a draft and verifying it disappears from Draft tab and appears in Published tab.

**Acceptance Scenarios**:

1. **Given** a draft post, **When** the user clicks "Publish Now", **Then** the post is published to LinkedIn, its status changes to `Published`, and it appears in the Published tab.
2. **Given** the LinkedIn API is unavailable, **When** the user clicks "Publish Now", **Then** the post status changes to `Failed`, an error message is shown, and the post does not move to the Published tab.
3. **Given** the user is on the Draft tab, **When** a post is successfully published, **Then** it is immediately removed from the Draft tab without requiring a page refresh.

---

### User Story 4 - Schedule a Draft Post (Priority: P2)

A user selects "Schedule" on a draft, picks a future date, and confirms. The post status changes to `Scheduled` and it moves from the Draft tab to the Scheduled tab.

**Why this priority**: Scheduling enables planned content calendars and is a key differentiator from instant publishing.

**Independent Test**: Can be tested by scheduling a draft for a future date and verifying it appears in the Scheduled tab with the correct date.

**Acceptance Scenarios**:

1. **Given** a draft post, **When** the user picks a future date and confirms scheduling, **Then** the post status changes to `Scheduled` and it appears in the Scheduled tab with the selected date.
2. **Given** a user confirms a schedule, **When** the scheduled date arrives, **Then** the cron job publishes the post and its status changes to `Published`.
3. **Given** a scheduled post, **When** the user views the Scheduled tab, **Then** the scheduled publication date is clearly displayed.

---

### User Story 5 - Reject a Draft Post (Priority: P3)

A user selects "Reject" on a draft post. The post status changes to `Rejected` and it is removed from the Draft tab.

**Why this priority**: Rejection is a content-quality gate — lower priority than publishing flows but important for keeping the Draft tab clean.

**Independent Test**: Can be tested by clicking "Reject" on a draft and verifying it no longer appears in the Draft tab.

**Acceptance Scenarios**:

1. **Given** a draft post, **When** the user clicks "Reject", **Then** the post status changes to `Rejected` and it is immediately removed from the Draft tab.
2. **Given** a rejected post, **When** the user views the Published or Scheduled tabs, **Then** the rejected post does not appear there.
3. **Given** a user clicks "Reject", **When** the action completes, **Then** a confirmation message is shown.

---

### User Story 6 - View Posts by Tab (Priority: P1)

A logged-in user can view their posts organised into tabs: Draft, Scheduled, and Published. Each tab shows only that user's posts with the matching status.

**Why this priority**: Tab-based status separation is the primary navigation model for the entire workflow.

**Independent Test**: Can be tested by creating posts with different statuses and verifying each tab shows only the correct posts for the logged-in user.

**Acceptance Scenarios**:

1. **Given** a logged-in user with posts in multiple states, **When** they view the Draft tab, **Then** only their `Draft` posts are shown.
2. **Given** a logged-in user, **When** they view the Scheduled tab, **Then** only their explicitly scheduled posts are shown.
3. **Given** a logged-in user, **When** they view the Published tab, **Then** only their `Published` (and `Failed`) posts are shown.
4. **Given** two different users each with posts, **When** either user views any tab, **Then** they see only their own posts.

---

### Edge Cases

- What happens when a user attempts to publish a post that is already `Published` or `Rejected`? → The action is blocked with an appropriate error message; no status change occurs.
- What happens if the LinkedIn API fails mid-publish? → The post status is set to `Failed`, error details are recorded, and the post appears in the Published tab under a failed state.
- What happens when a user tries to edit a `Scheduled` or `Published` post? → Editing is only permitted on `Draft` posts; attempting to edit others is rejected.
- What happens if a user's session expires between draft creation and publishing? → The post remains in `Draft` status; the user must re-authenticate before taking further action.
- What happens when multiple posts exist for the same date? → Multiple posts per day are permitted; no uniqueness constraint on date.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every post MUST be associated with the user who created it; this association MUST NOT change for the lifetime of the post.
- **FR-002**: A newly generated post saved by the user MUST be stored with status `Draft` and the creator's user ID.
- **FR-003**: Each draft post MUST expose four actions to its owner: Edit, Schedule, Publish Now, and Reject.
- **FR-004**: Editing a draft and saving MUST leave the post in `Draft` status with the same owner; no status transition occurs on save.
- **FR-005**: "Publish Now" MUST transition the post from `Draft` → `Published` (or `Failed` on error) and move it out of the Draft tab in real time.
- **FR-006**: "Schedule" MUST transition the post from `Draft` → `Scheduled`, record the selected future date, and move the post to the Scheduled tab immediately.
- **FR-007**: "Reject" MUST transition the post from `Draft` → `Rejected` and remove it from the Draft tab immediately.
- **FR-008**: Status transitions MUST only occur as a result of explicit user actions (Publish Now, Schedule, Reject); saving edits MUST NOT trigger a transition.
- **FR-009**: Users MUST only be able to view, edit, and act on posts they own; accessing another user's posts MUST be denied.
- **FR-010**: The Draft tab MUST display only `Draft` posts that have not been explicitly scheduled.
- **FR-011**: The Scheduled tab MUST display only `Draft` posts that have been explicitly scheduled for a future date.
- **FR-012**: The Published tab MUST display posts with status `Published` or `Failed`.
- **FR-013**: Each tab MUST support pagination for users with large numbers of posts.
- **FR-014**: When a post's status changes, the relevant tabs MUST update in real time without requiring a full page reload.
- **FR-015**: The system MUST display a success or failure notification after every status-changing action.

### Key Entities

- **User**: Represents an authenticated individual; has a unique identity; owns zero or more posts.
- **Post**: The content unit — has a topic, body text, optional image, status, owner (User), scheduled date, and timestamps. Statuses: `Draft`, `Scheduled`, `Published`, `Failed`, `Rejected`.
- **Publish Log**: Audit record of each publish attempt — links Post and User, records outcome (success/failure), timestamp, and error detail if applicable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can save a generated post as a draft and see it in the Draft tab within 2 seconds of the action.
- **SC-002**: Clicking "Publish Now" results in the post moving to the Published tab within the time it takes to receive a response from the publishing service (no additional UI delay beyond server response).
- **SC-003**: Clicking "Schedule" results in the post appearing in the Scheduled tab within 1 second of confirmation.
- **SC-004**: Clicking "Reject" removes the post from the Draft tab within 1 second (optimistic update).
- **SC-005**: 100% of draft actions (Edit, Schedule, Publish, Reject) are blocked for users who do not own the post.
- **SC-006**: Tab counts accurately reflect the number of posts in each status at all times; discrepancies resolve within one data refresh cycle.
- **SC-007**: Users with 50 or more posts can navigate paginated tabs without performance degradation.
- **SC-008**: All status transitions are durably recorded — a page refresh after any action reflects the correct, updated status.

## Assumptions

- A user is already authenticated via LinkedIn OAuth before interacting with the post management workflow; authentication is out of scope for this feature.
- Rejected posts are excluded from all active tabs (Draft, Scheduled, Published); a separate Rejected tab is not required for v1 but is not precluded.
- The "Schedule" action sets an explicit flag on the post (`isScheduled = true`) rather than relying on date comparisons, to avoid timezone ambiguity.
- The cron-based auto-publish of scheduled posts (at 08:00 UTC) is an existing capability; this feature specifies only the user-facing scheduling action, not the cron infrastructure.
- Multiple posts may be scheduled for the same date; no uniqueness constraint applies.
- Post content is capped at 3000 characters in line with LinkedIn's platform limit.
- The system is a single-tenant-per-user model: each authenticated session scopes all data operations to the logged-in user.
- Failed posts appear in the Published tab (under a `Failed` sub-status) rather than returning to Draft, so users can see what went wrong.

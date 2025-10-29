# User Story: Enhanced Search with Filtered Tree View


## Business Context

Currently, the NodeFlow application provides a search functionality that displays matching results in a separate "Search Results" panel showing clickable paths to matched items. However, this approach has usability limitations:

- Users cannot see the hierarchical context of search results within their tree structure
- The full tree remains visible below search results, causing confusion about what matches and what doesn't
- Users need to click on individual search results to navigate, rather than seeing all matches in their natural hierarchy
- There's no visual highlighting of the search term within the content, making it harder to understand why an item matched

This creates a suboptimal search experience compared to industry-standard hierarchical search implementations where users expect to see a filtered view of their tree structure with matches highlighted in context.

The enhanced search feature will transform the search experience to match user expectations by filtering the tree to show only relevant results with their hierarchical context, similar to proven patterns in successful outliner applications.

---

## Story Text

**As a** NodeFlow user managing hierarchical to-do lists  
**I want to** search for keywords and see a filtered tree view showing only matching items with their parent hierarchy and children, with the search term highlighted  
**So that** I can quickly find and understand the context of my search results within the tree structure and interact with them without losing hierarchical context

---

## Acceptance Criteria

### AC1: Filtered Tree Display on Search
**Given** I have a hierarchical tree with multiple nodes containing various content  
**When** I enter a search keyword in the search input field  
**Then** the main tree view should be filtered to show only:
- Nodes that contain the search keyword in their content, tags, or notes
- All ancestor nodes (parent, grandparent, etc.) of matching nodes up to the root level
- All descendant nodes (children, grandchildren, etc.) of matching nodes
**And** the separate "Search Results" panel should not be displayed
**And** the filtered tree should maintain the same hierarchical structure and indentation as the full tree

### AC2: Search Term Highlighting
**Given** the tree view is filtered with search results  
**When** I view the filtered nodes  
**Then** the exact search keyword should be highlighted within the node content with a distinct visual indicator (e.g., yellow background)
**And** the highlighting should be case-insensitive (searching "milk" highlights "Milk", "MILK", "milk")
**And** only the matching keyword text should be highlighted, not the entire node

### AC3: Non-Matching Ancestor Display
**Given** a matching node has parent nodes that don't contain the search term  
**When** the filtered tree is displayed  
**Then** all ancestor nodes should be visible to show the hierarchical path
**And** ancestor nodes should be displayed normally without special styling (not grayed out or dimmed)
**And** the tree structure should allow users to understand the full path from root to matching items

### AC4: Full Interactivity in Filtered View
**Given** I am viewing the filtered tree with search results  
**When** I interact with any visible node (matching or ancestor)  
**Then** I should be able to:
- Edit the content of any node
- Mark nodes as complete/incomplete
- Expand or collapse nodes with children
- Create new sibling or child nodes
- Delete nodes
- Move nodes within the visible hierarchy
- Add tags or notes
**And** all interactions should work exactly as they do in the unfiltered tree view

### AC5: No Results State
**Given** I enter a search keyword that doesn't match any nodes  
**When** the search is executed  
**Then** the tree view should display empty
**And** a "No results found for '[search term]'" message should be displayed in the tree area
**And** a "Back" or "Clear Search" button/option should be prominently available to return to the unfiltered tree

### AC6: Search Persistence Until Explicit Clear
**Given** I have performed a search and see filtered results  
**When** I clear all text from the search input field (making it empty)  
**Then** the filtered tree view should remain displayed
**And** the view should only return to the full unfiltered tree when:
- I click the "×" (clear) button next to the search input, OR
- I click the "Back" or "Clear Search" option from the no-results state, OR
- I close the search panel entirely

### AC7: Return to Full Tree
**Given** I am viewing a filtered search result tree  
**When** I click the "×" (clear) button or close the search panel  
**Then** the search input should be cleared
**And** the full unfiltered tree should be displayed immediately
**And** all nodes should be visible in their original state (expanded/collapsed as they were before search)
**And** the tree scroll position should return to where it was before the search (or top of tree)

### AC8: Search Across Multiple Fields
**Given** I have nodes with content, tags, and notes  
**When** I search for a keyword  
**Then** the search should match against:
- Node content text
- Tag values (e.g., searching "grocery" matches nodes tagged with #grocery or #groceries)
- Note content associated with nodes
**And** nodes matching in any of these fields should be included in filtered results

### AC9: Real-time Filter Updates
**Given** I am typing in the search input field  
**When** I add or remove characters  
**Then** the filtered tree view should update in real-time as I type
**And** the filtering should be responsive with minimal delay (< 300ms)
**And** highlights should update to reflect the current search term

### AC10: Preserve Tree State During Search
**Given** I have certain nodes expanded and others collapsed in my tree  
**When** I perform a search and then clear it to return to the full tree  
**Then** nodes should return to their previous expanded/collapsed states
**And** if I had nodes selected before search, the selection should be preserved if those nodes are still visible

---

## Out of Scope

The following are explicitly **NOT** included in this story:

1. **Advanced search operators** - Boolean operators (AND, OR, NOT), regex patterns, or wildcard searches
2. **Search history** - Saving or suggesting previous search queries
3. **Search result count badge** - Showing "X results found" counter (can be added later as enhancement)
4. **Keyboard navigation** between search results (e.g., Ctrl+G for next match)
5. **Search within specific fields** - Separate filters for "search only in content" vs "search only in tags"
6. **Saved searches** or search bookmarks
7. **Export of filtered search results** as a separate file
8. **Multi-keyword search** - Searching for multiple terms simultaneously (e.g., "milk AND bread")
9. **Search result ranking** - Ordering results by relevance score
10. **Highlighting in notes panel** - If notes are displayed separately, highlighting within notes view
11. **Backend search endpoint modifications** - This story focuses on frontend filtering of already-loaded nodes

---

## Technical Notes

### Frontend Implementation

**Components Affected:**
- `app.component.ts` / `app.component.html` - Main search orchestration
- `node-tree.component.ts` - Tree rendering with filtering logic
- `node-item.component.ts` - Individual node display with highlighting
- `search-results.component.ts` - **TO BE REMOVED** or hidden during filtered tree mode
- `search.service.ts` - Enhanced to provide filtered node IDs and ancestor/descendant resolution
   
### Testing Considerations

**Unit Tests Required:**
- SearchService: `computeVisibleNodes()` with various tree structures
- SearchService: Ancestor resolution for multi-level hierarchies
- SearchService: Descendant resolution for nodes with many children
- Highlighting logic: Case-insensitive matching, special characters, multiple occurrences
---

## Dependencies

**Internal Dependencies:**
- None - this is a standalone feature enhancement to existing search functionality

**External Dependencies:**
- None - uses existing Angular and RxJS capabilities

**Assumptions:**
- All nodes are loaded in memory (current behavior via `StateService.getAllNodes()`)
- Search operates on client-side data, not server-side filtering
- Current node data structure remains unchanged (id, content, parentId, tags, notes)

---

## Non-Functional Requirements (NFRs)

The following NFRs are relevant to this story. Please confirm which should be included as acceptance criteria vs. tracked separately:

### Performance NFRs
- **NFR-P1:** Search filtering should complete within 300ms for trees up to 1,000 nodes
- **NFR-P2:** Typing in search input should not cause visible lag or stuttering in the UI
- **NFR-P3:** Tree re-rendering after filter changes should be smooth (60fps)

### Usability NFRs
- **NFR-U1:** Highlight color should have sufficient contrast ratio (WCAG AA: 4.5:1) for readability
- **NFR-U2:** Keyboard navigation (Tab, Arrow keys) should work in filtered tree view
- **NFR-U3:** Screen readers should announce number of search results and context

### Accessibility NFRs
- **NFR-A1:** Search input should have proper ARIA labels
- **NFR-A2:** Highlighted search terms should be programmatically announced to screen readers
- **NFR-A3:** "No results" state should be announced to assistive technologies

### Browser Compatibility NFRs
- **NFR-B1:** Feature should work in Chrome, Firefox, Safari, Edge (latest 2 versions)
- **NFR-B2:** Highlighting should render consistently across all supported browsers

**Question for Product Owner:** Should any of these NFRs be included as acceptance criteria in this story, or should they be tracked as separate NFR stories?

---

## Mockups / Supporting Documents

### Wireframe: Filtered Tree View

```
┌─────────────────────────────────────────────────────┐
│ NodeFlow                              [Search] [≡]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔍 [search keyword____________] [×]                │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Filtered Tree (showing matches + context)          │
│                                                     │
│  ▼ Projects                                        │
│    ▼ Shopping                                      │
│        ▼ Groceries                                 │
│            □ Buy [milk] from store ← highlighted   │
│                □ Get organic [milk]                │
│    ▼ Work                                          │
│        □ Send [milk] expense report                │
│                                                     │
└─────────────────────────────────────────────────────┘

Legend:
- "Projects", "Shopping", "Groceries" = ancestor nodes (visible for context)
- [milk] = highlighted search term (yellow background)
- Items with [milk] = matching nodes
- Indented items = child nodes of matches
```

### Wireframe: No Results State

```
┌─────────────────────────────────────────────────────┐
│ NodeFlow                              [Search] [≡]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔍 [xyz_nonexistent_term___] [×]                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              🔍                                      │
│                                                     │
│        No results found for "xyz_nonexistent_term"  │
│                                                     │
│              [← Back to Full Tree]                  │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Sequence Diagram: Search Flow

```
User          SearchInput      SearchService    StateService    NodeTree
 |                |                 |                |             |
 |--types "milk"->|                 |                |             |
 |                |--search("milk")->|                |             |
 |                |                 |--getAllNodes()->|             |
 |                |                 |<-return nodes--|             |
 |                |                 |                |             |
 |                |                 |--compute visible IDs         |
 |                |                 |  (matches + ancestors        |
 |                |                 |   + descendants)             |
 |                |                 |                |             |
 |                |                 |--emit filteredNodeIds$------>|
 |                |                 |                |             |
 |                |                 |                |     --filter tree
 |                |                 |                |     --apply highlights
 |                |                 |                |             |
 |<------------------------------------display filtered tree-------|
 |                |                 |                |             |
 |--clicks [×]--->|                 |                |             |
 |                |--clearSearch()-->|                |             |
 |                |                 |--emit empty Set------------>|
 |                |                 |                |             |
 |<------------------------------------display full tree----------|
```

### User Flow Diagram

```
┌─────────────────┐
│  User clicks    │
│  Search button  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Search input   │
│  field appears  │
│  & gets focus   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      No        ┌──────────────────┐
│  User types     ├──────text?────→│  Full tree       │
│  search term    │                │  remains visible │
└────────┬────────┘                └──────────────────┘
         │
         │ Has text
         ▼
┌─────────────────┐
│  Filter tree    │
│  to matching    │
│  nodes + context│
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌─────────────┐
│  Results     │  │  No results │
│  found       │  │  found      │
└──────┬───────┘  └──────┬──────┘
       │                 │
       │                 ▼
       │          ┌──────────────┐
       │          │  Show "No    │
       │          │  results"    │
       │          │  + Back btn  │
       │          └──────┬───────┘
       │                 │
       │                 │ Click Back
       │                 ▼
       │          ┌──────────────┐
       │          │  Return to   │
       │          │  full tree   │
       │          └──────────────┘
       │
       ▼
┌──────────────┐
│  User can    │
│  interact    │
│  with nodes  │
└──────┬───────┘
       │
       │ Click ×
       ▼
┌──────────────┐
│  Clear search│
│  Return to   │
│  full tree   │
└──────────────┘
```

---

## Definition of Done

- [ ] All acceptance criteria are met and verified
- [ ] Code is implemented following existing patterns in the codebase
- [ ] Unit tests written and passing (min. 80% coverage for new code)
- [ ] Integration tests verify end-to-end search flow
- [ ] Code review completed and approved
- [ ] No console errors or warnings in browser
- [ ] Manual testing completed on Chrome, Firefox, Safari
- [ ] Highlighting works correctly with special characters and edge cases
- [ ] Performance verified: search completes within 300ms for 1,000 nodes
- [ ] Documentation updated (if needed)
- [ ] Feature demo completed with stakeholders
- [ ] No regressions in existing search or tree functionality

---

## Additional Notes

### Edge Cases to Consider

1. **Search term appears multiple times in same node**
   - Example: "Buy milk and milk powder"
   - Should highlight both occurrences

2. **Search term spans multiple words in tags**
   - Example: searching "shop" matches "#shopping"
   - Should work as expected

3. **Special characters in search term**
   - Example: searching "C++" or "user@email.com"
   - Should escape regex special characters

4. **Very long search terms**
   - Should truncate gracefully in UI if needed

5. **Search in collapsed nodes**
   - Matching nodes should be visible even if they were collapsed before search
   - After clearing search, should they return to collapsed state? (Yes, per AC10)

6. **Concurrent edits during search**
   - If user edits a node's content while search is active and removes the matching term, should the node disappear from filtered view in real-time? (Yes, due to real-time updates in AC9)


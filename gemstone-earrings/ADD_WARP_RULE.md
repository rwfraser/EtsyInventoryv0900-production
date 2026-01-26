# How to Add "No Prisma" Rule to Warp

To ensure I never recommend Prisma in future sessions, you need to add a Rule in Warp.

## Steps:

1. **Open Warp Settings**
   - Click the gear icon (⚙️) in the bottom left
   - OR press `Ctrl+,` (Windows) or `Cmd+,` (Mac)

2. **Go to AI Settings**
   - Click "AI" in the left sidebar
   - Scroll down to "Rules" section

3. **Add New Rule**
   - Click "+ Add Rule"
   - Type this rule:
   
   ```
   Never recommend or use Prisma ORM for any project. 
   Always use Drizzle ORM for database operations instead. 
   Prisma has caused significant problems in 3 previous projects.
   ```

4. **Save**
   - The rule will now persist across all future sessions

## Alternative: Project-Specific Rule

If you want this rule only for this project:

1. Create a file named `WARP.md` in your project root
2. Add the rule content to that file
3. Warp will automatically load project-specific rules from `WARP.md`

---

## What This Does

- The rule gets loaded into every new Warp AI session
- I will see it in my system instructions
- It will remind me to use Drizzle instead of Prisma
- Works across all your projects (if added to general rules)
- OR works only for this project (if added to WARP.md)

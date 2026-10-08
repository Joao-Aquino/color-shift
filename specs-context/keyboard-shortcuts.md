# Keyboard shortcuts — Color Shift

Verified against the application handlers on 2026-10-08. Action shortcuts run the
same motion as pointer clicks; reduced-motion and unsupported-API fallbacks still
apply. Single-letter actions do not override typing in a text field.

Theme and photo/color action tooltips show their shortcut inside the Figma
boxed-key design. Undo shows the Phosphor Command icon on Apple platforms and
Control icon elsewhere, with Z inside the same box. Arrow shortcuts use icons.
Fix contrast shows F. Export shows the platform modifier with S in one box.

## App actions

| Shortcut | Action | Context |
| --- | --- | --- |
| `T` | Toggle Light/Dark with the horizontal wipe | Anywhere outside text input, including focused theme buttons; holding T does not continuously toggle |
| `S` | Swap background and foreground | Outside text input and focused interactive controls |
| `F` | Fix contrast to the selected threshold | Outside text input and focused interactive controls; requires an available correction; holding F does not repeat |
| `⌘ S` / `Ctrl S` | Open export actions | Available across focused controls, including text editing; preserves the text and focuses COPY; ignores repeats and an already open/loading export |
| `Space` | Load a new random photo | Outside text input and focused interactive controls |
| `←` | Previous photo | Outside text input and focused interactive controls; requires a previous photo |
| `→` | Next photo | Outside text input and focused interactive controls; requires a next photo |
| `⌘ Z` / `Ctrl Z` | Undo a color edit | Outside text input; inside text input the native text undo behavior applies |
| `Escape` | Close open editor, expanded thresholds or export actions | Context-specific; in specimen text it ends editing/focus; in a numeric/readout field it cancels the current draft |

## Focused controls

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift Tab` | Move focus forward/backward |
| `Enter` / `Space` on a button | Activate it with the same animation as clicking |
| `Enter` in a numeric or full-color readout | Commit the draft value |
| `Escape` in a numeric or full-color readout | Discard the draft and restore the prior value |
| `←` / `→` on a horizontal tab list | Move/activate adjacent tabs using the existing Radix behavior |
| `Home` / `End` on tabs | Focus the first/last tab |
| Arrow keys on a color slider | Adjust its value using native Radix keyboard control |
| `Home` / `End` on a color slider | Set the minimum/maximum |
| `Page Up` / `Page Down` on a color slider | Make a larger value adjustment |
| Arrow keys / `Home` / `End` while editing specimen text | Native caret movement; Shift extends the selection |

Fix contrast and EXPORT also support Enter/Space when their buttons are focused. Browser/editor copy, paste, cut and select-all
shortcuts retain their native behavior.

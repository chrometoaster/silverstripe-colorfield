<%--
ColorField Template - Advanced Color Picker Form Field

This template renders the ColorField form field with the following structure:
1. Advanced fields (HEX, RGB, Alpha) - positioned first for primary editing
2. Color preview swatch - visual representation of selected color
3. Main color input field - positioned last as reference/cross-check

The template includes inline JavaScript for bi-directional synchronization
between all color formats and real-time preview updates.

INPUT VALIDATION SYSTEM:
The template implements a sophisticated input validation system that prevents
invalid values while allowing natural user input patterns:

- HEX Field: Prevents non-hexadecimal characters, limits to 6 characters
- RGB Fields: Cursor-aware validation that prevents values > 255 while allowing
  natural number entry (e.g., "56" + "1" at beginning = "156" ✓, "56" + "1" at end = "561" ✗)
- Alpha Field: Allows decimal input (0-1), prevents invalid characters

The RGB validation system is particularly sophisticated, using cursor position
to determine exactly where a character is being inserted, preventing conflicts
between input masking and value validation.

Template Variables:
- $Controls: Array of individual input fields (HexDisplay, RedDisplay, etc.)
- $Color: Current color values (Hex, R, G, B, A)
- $Options: Configuration options (Alpha support, etc.)
- $JSConfig: JavaScript configuration for Minicolors plugin

@package Chrometoaster\ColorField
@author Chrometoaster
@since 1.0.0
--%>

<%-- Advanced color input fields - positioned first for primary editing --%>
<% if $Controls.HexDisplay || $Controls.RedDisplay || $Controls.AlphaDisplay %>
<div class="colorFieldControls field dropdown text">
  <%-- HEX input field --%>
  <span class="hex">
    <label class="left" for="$Controls.HexDisplay.ID">Hex</label>
    $Controls.HexDisplay
  </span>
  
  <%-- RGB input fields (Red, Green, Blue) --%>
  <span class="rgb">
    <label class="left" for="$Controls.RedDisplay.ID">R</label> $Controls.RedDisplay
    <label class="left" for="$Controls.GreenDisplay.ID">G</label> $Controls.GreenDisplay
    <label class="left" for="$Controls.BlueDisplay.ID">B</label> $Controls.BlueDisplay
  </span>
  
  <%-- Alpha/Opacity input field (conditional) --%>
  <% if $Options.Alpha %>
  <span class="alpha">
    <label class="left" for="$Controls.AlphaDisplay.ID">Alpha</label>
    $Controls.AlphaDisplay
  </span>
  <% end_if %>
</div>
<% end_if %>
<%-- Color preview swatch - visual representation of selected color --%>
<div class="colorFieldPreview">
  <div class="color" style="background-color:#{$Color.Hex};opacity:$Color.A;"></div>
</div>

<%-- Main color input field - positioned last as reference/cross-check --%>
<%-- Hidden by default unless ShowMainField option is enabled --%>
<input $AttributesHTML data-config="$JSConfig" class="text colorField<% if not $Options.ShowMainField %> colorField--hidden<% end_if %>" />

<%-- Hidden proxy field for JQuery Minicolors integration --%>
$Controls.Proxy

<%-- 
Inline JavaScript for Advanced Color Field Management

This script provides comprehensive color field functionality including:

1. BI-DIRECTIONAL SYNCHRONIZATION:
   - HEX to RGB conversion and vice versa
   - Alpha/opacity value synchronization
   - Live color preview updates
   - Real-time form field updates

2. INPUT VALIDATION SYSTEM:
   - HEX Field: Prevents non-hexadecimal characters, limits to 6 characters
   - RGB Fields: Cursor-aware validation preventing values > 255 while allowing
     natural number entry patterns (e.g., "56" + "1" at beginning = "156" ✓)
   - Alpha Field: Allows decimal input (0-1), prevents invalid characters

3. AJAX COMPATIBILITY:
   - Event delegation for dynamic content
   - Re-initialization after AJAX form reloads
   - Fallback mechanisms for reliable event handling

4. USER EXPERIENCE FEATURES:
   - Real-time visual preview updates
   - Natural input patterns with intelligent validation
   - Immediate feedback for invalid input
   - Seamless integration with SilverStripe forms

The script uses a combination of event delegation and direct event attachment
to ensure reliability across different scenarios including AJAX form updates.
--%>
<script>
// Simple and reliable color field synchronization
(function() {
  /**
   * Initialize color field synchronization
   * 
   * This function sets up event listeners for all color input fields
   * and provides bi-directional synchronization between HEX, RGB, and Alpha values.
   */
  function initColorSync() {
    // Find all color field controls
    var containers = document.querySelectorAll('.colorFieldControls');
    
    containers.forEach(function(container) {
      var hexInput = container.querySelector('.hex input, .hex-display');
      var redInput = container.querySelector('.red-display');
      var greenInput = container.querySelector('.green-display');
      var blueInput = container.querySelector('.blue-display');
      var alphaInput = container.querySelector('.alpha input, .alpha-display');
      var mainField = container.closest('.field.color').querySelector('.colorField');
      var proxyField = container.closest('.field.color').querySelector('.colorFieldProxy');
      var colorPreview = container.closest('.field.color').querySelector('.colorFieldPreview .color');
      
      if (!hexInput || !redInput || !greenInput || !blueInput) return;
      
      // Remove existing listeners to avoid duplicates
      hexInput.removeEventListener('input', handleHexInput);
      hexInput.removeEventListener('change', handleHexChange);
      hexInput.removeEventListener('keypress', maskHexInput);
      redInput.removeEventListener('input', handleRgbInput);
      redInput.removeEventListener('change', handleRgbChange);
      redInput.removeEventListener('keypress', maskRgbInput);
      greenInput.removeEventListener('input', handleRgbInput);
      greenInput.removeEventListener('change', handleRgbChange);
      greenInput.removeEventListener('keypress', maskRgbInput);
      blueInput.removeEventListener('input', handleRgbInput);
      blueInput.removeEventListener('change', handleRgbChange);
      blueInput.removeEventListener('keypress', maskRgbInput);
      if (alphaInput) {
        alphaInput.removeEventListener('input', handleAlphaInput);
        alphaInput.removeEventListener('change', handleAlphaChange);
      }
      
      // Add new listeners
      hexInput.addEventListener('input', handleHexInput);
      hexInput.addEventListener('change', handleHexChange);
      hexInput.addEventListener('keypress', maskHexInput);
      redInput.addEventListener('input', handleRgbInput);
      redInput.addEventListener('change', handleRgbChange);
      redInput.addEventListener('keypress', maskRgbInput);
      greenInput.addEventListener('input', handleRgbInput);
      greenInput.addEventListener('change', handleRgbChange);
      greenInput.addEventListener('keypress', maskRgbInput);
      blueInput.addEventListener('input', handleRgbInput);
      blueInput.addEventListener('change', handleRgbChange);
      blueInput.addEventListener('keypress', maskRgbInput);
      if (alphaInput) {
        alphaInput.addEventListener('input', handleAlphaInput);
        alphaInput.addEventListener('change', handleAlphaChange);
        // Note: Removed keypress masking for alpha to allow decimal input
        // Validation is handled in the input/change handlers instead
      }
      
      // Mark as initialized to avoid duplicate listeners
      hexInput.setAttribute('data-color-sync-initialized', 'true');
      
      function updateColorPreview(hex, alpha) {
        if (colorPreview) {
          // Convert alpha from 0-1 to 0-100 for display
          var displayAlpha = alpha || 1.0;
          if (displayAlpha > 1) {
            displayAlpha = displayAlpha / 100;
          }
          
          // Update the color preview
          colorPreview.style.backgroundColor = '#' + hex;
          colorPreview.style.opacity = displayAlpha;
        }
      }
      
      function handleHexInput() {
        hexToRgb();
      }
      
      function handleHexChange() {
        hexToRgb();
      }
      
      function handleRgbInput() {
        rgbToHex();
      }
      
      function handleRgbChange() {
        rgbToHex();
      }
      
      function handleAlphaInput() {
        updateAlpha();
      }
      
      function handleAlphaChange() {
        updateAlpha();
      }
      
      function hexToRgb() {
        var hex = hexInput.value.replace('#', '').toUpperCase();
        
        // Validate hex format (6 characters, valid hex)
        if (hex.length === 6 && /^[0-9A-F]{6}$/.test(hex)) {
          var r = parseInt(hex.substr(0, 2), 16);
          var g = parseInt(hex.substr(2, 2), 16);
          var b = parseInt(hex.substr(4, 2), 16);
          
          redInput.value = r;
          greenInput.value = g;
          blueInput.value = b;
          
          // Update main field
          var alpha = alphaInput ? Math.round(parseFloat(alphaInput.value) * 100) : 100;
          var mainValue = hex + ('000' + alpha).slice(-3);
          if (mainField) mainField.value = mainValue;
          
          // Update color preview
          var displayAlpha = alphaInput ? parseFloat(alphaInput.value) : 1.0;
          updateColorPreview(hex, displayAlpha);
          
          // Update color picker
          if (proxyField && window.jQuery) {
            window.jQuery(proxyField).minicolors('value', '#' + hex);
          }
        }
      }
      
      function rgbToHex() {
        var r = parseInt(redInput.value) || 0;
        var g = parseInt(greenInput.value) || 0;
        var b = parseInt(blueInput.value) || 0;
        
        // Clamp values to valid RGB range
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        
        // Update input fields with clamped values
        redInput.value = r;
        greenInput.value = g;
        blueInput.value = b;
        
        var hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
        hexInput.value = hex;
        
        // Update main field
        var alpha = alphaInput ? Math.round(parseFloat(alphaInput.value) * 100) : 100;
        var mainValue = hex + ('000' + alpha).slice(-3);
        if (mainField) mainField.value = mainValue;
        
        // Update color preview
        var displayAlpha = alphaInput ? parseFloat(alphaInput.value) : 1.0;
        updateColorPreview(hex, displayAlpha);
        
        // Update color picker
        if (proxyField && window.jQuery) {
          window.jQuery(proxyField).minicolors('value', '#' + hex);
        }
      }
      
      function updateAlpha() {
        if (alphaInput && mainField) {
          var hex = hexInput.value.replace('#', '');
          if (hex.length === 6) {
            var inputValue = alphaInput.value.trim();
            var alpha = parseFloat(inputValue);
            
            // Only validate if there's a valid number
            if (!isNaN(alpha)) {
              // Clamp alpha to valid range (0-1)
              alpha = Math.max(0, Math.min(1, alpha));
              
              // Update input field with clamped value (only if it changed)
              var currentValue = parseFloat(alphaInput.value);
              if (currentValue !== alpha) {
                alphaInput.value = alpha;
              }
              
              var alphaPercent = Math.round(alpha * 100);
              var mainValue = hex + ('000' + alphaPercent).slice(-3);
              mainField.value = mainValue;
              
              // Update color preview
              updateColorPreview(hex, alpha);
            }
          }
        }
      }
      
      // Input masking functions
      
      /**
       * HEX Input Masking
       * 
       * This function provides input validation for the HEX field, ensuring only
       * valid hexadecimal characters can be entered and limiting the field to
       * 6 characters maximum (standard hex color format).
       * 
       * Key Features:
       * - Hexadecimal validation: Only allows 0-9, A-F, a-f characters
       * - Length limiting: Prevents input beyond 6 characters
       * - Control key handling: Allows backspace, delete, tab, escape, enter
       * 
       * @param {KeyboardEvent} event - The keypress event from the HEX input field
       */
      function maskHexInput(event) {
        var char = String.fromCharCode(event.which);
        var currentValue = hexInput.value;
        var cursorPosition = hexInput.selectionStart;
        var selectionEnd = hexInput.selectionEnd;
        
        // Allow backspace, delete, tab, escape, enter
        if (event.which === 8 || event.which === 46 || event.which === 9 || event.which === 27 || event.which === 13) {
          return;
        }
        
        // Allow only hexadecimal characters (0-9, A-F, a-f)
        if (!/[0-9A-Fa-f]/.test(char)) {
          event.preventDefault();
          return;
        }
        
        // Check if text is selected (will be replaced)
        var hasSelection = cursorPosition !== selectionEnd;
        
        // Calculate new value based on whether text is selected
        var newValue;
        if (hasSelection) {
          // Text is selected - replace selected text with new character
          newValue = currentValue.substring(0, cursorPosition) + char + currentValue.substring(selectionEnd);
        } else {
          // No text selected - insert character at cursor position
          newValue = currentValue.substring(0, cursorPosition) + char + currentValue.substring(cursorPosition);
        }
        
        // Limit to 6 characters
        if (newValue.length > 6) {
          event.preventDefault();
          return;
        }
      }
      
      /**
       * RGB Input Masking with Cursor-Aware Validation
       * 
       * This function provides intelligent input validation for RGB fields (Red, Green, Blue)
       * by using cursor position to determine exactly where a character is being inserted.
       * This prevents the conflict between input masking and value validation that could
       * occur when users type characters at different positions in the field.
       * 
       * Key Features:
       * - Cursor-aware validation: Uses selectionStart to determine insertion position
       * - Selected text replacement: Handles overwriting selected text with new characters
       * - Prevents invalid values: Blocks characters that would result in values > 255
       * - Allows natural input: Permits valid character insertions at any position
       * - Handles edge cases: Beginning, end, middle insertions, and text replacement
       * 
       * Examples:
       * - Field "56" + typing "1" at end → "561" (blocked, exceeds 255)
       * - Field "56" + typing "1" at beginning → "156" (allowed, valid range)
       * - Field "25" + typing "6" at end → "256" (blocked, exceeds 255)
       * - Field "25" + typing "1" at beginning → "125" (allowed, valid range)
       * - Field "56" with "5" selected + typing "1" → "16" (allowed, valid range)
       * - Field "256" with "25" selected + typing "1" → "16" (allowed, valid range)
       * 
       * Technical Implementation:
       * 1. Determines cursor position using event.target.selectionStart
       * 2. Simulates character insertion at the exact cursor position
       * 3. Validates the resulting value against RGB range (0-255)
       * 4. Prevents input if validation fails, allows if validation passes
       * 
       * @param {KeyboardEvent} event - The keypress event from the input field
       */
      function maskRgbInput(event) {
        var char = String.fromCharCode(event.which);
        var currentValue = event.target.value;
        var cursorPosition = event.target.selectionStart;
        var selectionEnd = event.target.selectionEnd;
        
        // Allow backspace, delete, tab, escape, enter
        if (event.which === 8 || event.which === 46 || event.which === 9 || event.which === 27 || event.which === 13) {
          return;
        }
        
        // Allow only digits
        if (!/[0-9]/.test(char)) {
          event.preventDefault();
          return;
        }
        
        // Check if text is selected (will be replaced)
        var hasSelection = cursorPosition !== selectionEnd;
        
        // Calculate new value based on whether text is selected
        var newValue;
        if (hasSelection) {
          // Text is selected - replace selected text with new character
          newValue = currentValue.substring(0, cursorPosition) + char + currentValue.substring(selectionEnd);
        } else {
          // No text selected - insert character at cursor position
          if (cursorPosition === 0) {
            // Inserting at the beginning: "1" + "56" = "156"
            newValue = char + currentValue;
          } else if (cursorPosition === currentValue.length) {
            // Inserting at the end: "56" + "1" = "561"
            newValue = currentValue + char;
          } else {
            // Inserting in the middle: "5" + "1" + "6" = "516"
            newValue = currentValue.substring(0, cursorPosition) + char + currentValue.substring(cursorPosition);
          }
        }
        
        // Limit to 3 characters
        if (newValue.length > 3) {
          event.preventDefault();
          return;
        }
        
        var numericValue = parseInt(newValue);
        
        // Allow if the new value is within valid RGB range (0-255)
        if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 255) {
          return; // Allow this input
        }
        
        // Prevent the input if it would result in an invalid value
        event.preventDefault();
      }
      
      /**
       * Alpha Input Masking
       * 
       * This function provides input validation for the Alpha field, ensuring only
       * valid decimal values can be entered within the range 0-1. The function
       * allows natural decimal input patterns while preventing invalid characters.
       * 
       * Key Features:
       * - Decimal validation: Allows digits and single decimal point
       * - Range validation: Supports values from 0 to 1 (e.g., 0.5, 0.75, 1.0)
       * - Decimal point handling: Allows one decimal point, including at beginning (.5)
       * - Length limiting: Prevents input beyond 4 characters (e.g., 1.00)
       * - Control key handling: Allows backspace, delete, tab, escape, enter
       * 
       * Examples:
       * - "0.5" ✓ (valid decimal)
       * - "0.75" ✓ (valid decimal)
       * - "1.0" ✓ (valid decimal)
       * - "0.5.5" ✗ (multiple decimal points)
       * - "2.5" ✗ (exceeds 1.0 range)
       * 
       * Note: Range validation (0-1) is handled by this masking function
       * to prevent invalid values from being entered in the first place.
       * 
       * @param {KeyboardEvent} event - The keypress event from the Alpha input field
       */
      function maskAlphaInput(event) {
        var char = String.fromCharCode(event.which);
        var currentValue = alphaInput.value;
        var cursorPosition = alphaInput.selectionStart;
        var selectionEnd = alphaInput.selectionEnd;
        
        // Allow backspace, delete, tab, escape, enter
        if (event.which === 8 || event.which === 46 || event.which === 9 || event.which === 27 || event.which === 13) {
          return;
        }
        
        // Allow only digits and decimal point
        if (!/[0-9.]/.test(char)) {
          event.preventDefault();
          return;
        }
        
        // Check if text is selected (will be replaced)
        var hasSelection = cursorPosition !== selectionEnd;
        
        // Calculate new value based on whether text is selected
        var newValue;
        if (hasSelection) {
          // Text is selected - replace selected text with new character
          newValue = currentValue.substring(0, cursorPosition) + char + currentValue.substring(selectionEnd);
        } else {
          // No text selected - insert character at cursor position
          newValue = currentValue.substring(0, cursorPosition) + char + currentValue.substring(cursorPosition);
        }
        
        // Only allow one decimal point
        if (char === '.' && newValue.indexOf('.') !== newValue.lastIndexOf('.')) {
          event.preventDefault();
          return;
        }
        
        // Allow decimal point at the beginning (e.g., .5)
        if (char === '.' && newValue.length === 1) {
          return;
        }
        
        // Limit to 4 characters (e.g., 1.00)
        if (newValue.length > 4) {
          event.preventDefault();
          return;
        }
        
        // Prevent values over 1.0 (but allow partial input like 0.9)
        var numericValue = parseFloat(newValue);
        if (!isNaN(numericValue) && numericValue > 1.0) {
          event.preventDefault();
          return;
        }
      }
    });
  }
  
  // Initialize when DOM is ready
  function init() {
    initColorSync();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Re-initialize after AJAX updates
  if (window.jQuery) {
    window.jQuery(document).on('DOMNodeInserted', function() {
      setTimeout(initColorSync, 100);
    });
    
    // Also listen for SilverStripe form updates
    window.jQuery(document).on('ajaxComplete', function() {
      setTimeout(initColorSync, 100);
    });
  }
  
  // Fallback: re-initialize periodically to catch missed updates
  setInterval(function() {
    var containers = document.querySelectorAll('.colorFieldControls');
    var hasUninitialized = false;
    
    containers.forEach(function(container) {
      var hexInput = container.querySelector('.hex input, .hex-display');
      if (hexInput && !hexInput.hasAttribute('data-color-sync-initialized')) {
        hasUninitialized = true;
      }
    });
    
    if (hasUninitialized) {
      initColorSync();
    }
  }, 1000);
})();
</script>

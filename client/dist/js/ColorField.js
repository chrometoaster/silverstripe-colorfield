/**
 * ColorField JavaScript - Advanced Color Picker Integration
 * 
 * This JavaScript file provides the core functionality for the ColorField form field,
 * including JQuery Minicolors integration, bi-directional synchronization between
 * color formats, and real-time color preview updates.
 * 
 * Key Features:
 * - JQuery Minicolors color picker initialization and management
 * - Bi-directional synchronization between HEX, RGB, and Alpha fields
 * - Real-time color preview updates
 * - Input validation and range clamping
 * - AJAX form reload handling for SilverStripe CMS
 * 
 * The synchronization system ensures that changes in any color format (HEX, RGB, Alpha)
 * are immediately reflected in all other formats and the visual preview.
 * 
 * @package Chrometoaster\ColorField
 * @author Thierry Francois @colymba
 * @author Chrometoaster (enhanced for SilverStripe 4.9+)
 * @since 1.0.0
 */

(function($) {
  $.entwine('ss', function($) {
    $.entwine('colymba', function($) {

      /**
       * Main color field synchronization
       * 
       * Handles synchronization between the main color field and the proxy field
       * used by JQuery Minicolors. This ensures the form submission value is
       * always up-to-date with the current color selection.
       */
      $('.colorField').entwine({
        /**
         * Initialize color field when matched
         * Automatically syncs the field value on initialization
         */
        onmatch: function(){
          this.sync();
        },
        
        /**
         * Cleanup when field is unmatched
         */
        onunmatch: function(){},
        
        /**
         * Synchronize main color field with proxy field
         * 
         * This method reads the current color value from the JQuery Minicolors
         * proxy field and updates the main form field with the combined HEX + Alpha
         * value in the format expected by the backend (RRGGBBAAA).
         */
        sync: function()
        {
          var $parent = this.closest('.field.color'),
              $proxy  = $parent.find('.colorFieldProxy'),
              hex     = $proxy.val().replace('#', ''),
              alpha   = parseFloat($proxy.attr('data-opacity')) * 100;

          // Format alpha as 3-digit string (e.g., 100, 050, 000)
          alpha = ('000' + alpha).slice(-3);
          
          // Update main field with combined HEX + Alpha value
          this.val(hex + alpha).attr('value', hex + alpha);
        }
      });


      /**
       * Color field proxy (JQuery Minicolors) management
       * 
       * This section handles the initialization and management of the JQuery Minicolors
       * color picker plugin, including the change callback that synchronizes all
       * color-related fields and updates the visual preview.
       */
      $('.colorFieldProxy').entwine({
        /**
         * Initialize Minicolors color picker when proxy field is matched
         * Sets up the color picker with configuration and change handlers
         */
        onmatch: function(){
          var $parent = this.closest('.field.color'),
              $field  = $parent.find('.colorField'),
              config  = $field.data('config') ? $field.data('config') : {};

          /**
           * Color change callback for Minicolors
           * 
           * This function is called whenever the color picker value changes.
           * It updates all related fields (HEX, RGB, Alpha) and the visual preview
           * to maintain synchronization across all color representations.
           * 
           * @param {string} hex - The selected color in hexadecimal format
           * @param {number} opacity - The selected opacity value (0-1)
           */
          config.change = function(hex, opacity) {
            // Get references to all color-related elements
            var $proxy  = $(this),
                $parent = $proxy.closest('.field.color'),
                $field  = $parent.find('.colorField'),
                $color  = $parent.find('.colorFieldPreview .color'),
                $hex    = $parent.find('.colorFieldControls .hex'),
                $red    = $parent.find('.colorFieldControls .red-display'),
                $green  = $parent.find('.colorFieldControls .green-display'),
                $blue   = $parent.find('.colorFieldControls .blue-display'),
                $alpha  = $parent.find('.colorFieldControls .alpha'),
                rgba    = $proxy.minicolors('rgbObject');

            // Update visual color preview
            $color.css({
              backgroundColor: hex,
              opacity: rgba.a
            });

            // Update individual color component fields
            $hex.val(hex.replace('#', ''));
            $alpha.val(rgba.a);
            $red.val(rgba.r);
            $green.val(rgba.g);
            $blue.val(rgba.b);

            // Sync the main form field with the updated values
            $field.sync();
          };

          // Initialize the Minicolors color picker with configuration
          this.minicolors(config);
        },
        
        /**
         * Cleanup when proxy field is unmatched
         */
        onunmatch: function(){}
      });


      /**
       * Bi-directional color field synchronization
       * 
       * This event handler provides real-time synchronization between all color
       * input fields (HEX, RGB, Alpha). When any field changes, it automatically
       * updates all other fields and the visual preview to maintain consistency.
       * 
       * Supported events: input, change, keyup, focusout
       * This ensures synchronization happens on typing, pasting, and field changes.
       */
      $(document).on('input change keyup focusout', '.colorFieldControls .hex input, .colorFieldControls .red-display, .colorFieldControls .green-display, .colorFieldControls .blue-display, .colorFieldControls .alpha input', function(e) {
        // Get references to all color-related elements
        var $field = $(this);
        var $parent = $field.closest('.field.color');
        var $proxy = $parent.find('.colorFieldProxy');
        var $mainField = $parent.find('.colorField');
        var $hex = $parent.find('.colorFieldControls .hex input');
        var $r = $parent.find('.colorFieldControls .red-display');
        var $g = $parent.find('.colorFieldControls .green-display');
        var $b = $parent.find('.colorFieldControls .blue-display');
        var $alpha = $parent.find('.colorFieldControls .alpha input');
        
        // Determine field type from the field name
        var type = $field.attr('name').split('_').pop();
        var r, g, b, a, hex, mainValue;

        // Handle HEX field changes
        if (type === 'hex') {
          // Convert HEX to RGB
          hex = $field.val().replace('#', '');
          if (hex.length === 6) {
            // Parse HEX values to RGB components
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
            
            // Update RGB fields
            $r.val(r);
            $g.val(g);
            $b.val(b);
            
            // Update main field and color picker
            a = $alpha.length > 0 ? Math.round(parseFloat($alpha.val()) * 100) : 100;
            mainValue = hex + ('000' + a).slice(-3);
            $mainField.val(mainValue);
            
            // Update Minicolors picker
            if ($proxy.length > 0) {
              $proxy.minicolors('value', '#' + hex);
            }
          }
        // Handle RGB field changes (Red, Green, Blue)
        } else if (type === 'red' || type === 'green' || type === 'blue') {
          // Convert RGB to HEX
          r = parseInt($r.val()) || 0;
          g = parseInt($g.val()) || 0;
          b = parseInt($b.val()) || 0;
          
          // Clamp RGB values to valid range (0-255)
          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));
          
          // Convert RGB to HEX string
          hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase();
          $hex.val(hex);
          
          // Update main field and color picker
          a = $alpha.length > 0 ? Math.round(parseFloat($alpha.val()) * 100) : 100;
          mainValue = hex + ('000' + a).slice(-3);
          $mainField.val(mainValue);
          
          if ($proxy.length > 0) {
            $proxy.minicolors('value', '#' + hex);
          }
        // Handle Alpha field changes
        } else if (type === 'alpha') {
          // Update main field when alpha changes
          hex = $hex.val().replace('#', '');
          if (hex.length === 6) {
            a = Math.round(parseFloat($field.val()) * 100);
            mainValue = hex + ('000' + a).slice(-3);
            $mainField.val(mainValue);
          }
        }
      });

      $('.colorFieldControls .hex input, .colorFieldControls .red-display, .colorFieldControls .green-display, .colorFieldControls .blue-display, .colorFieldControls .alpha input').entwine({
        onmatch: function(){},
        onunmatch: function(){},

        onchange: function(e){          
          this.updateProxy(e);
        },
        onkeyup: function(e){
          this.updateProxy(e);
        },
        onfocusout: function(e){
          this.updateProxy(e);
        },

        updateProxy: function(e){
          var $parent  = this.closest('.field.color'),
              $proxy   = $parent.find('.colorFieldProxy'),
              $r       = $parent.find('.colorFieldControls .red-display'),
              $g       = $parent.find('.colorFieldControls .green-display'),
              $b       = $parent.find('.colorFieldControls .blue-display'),
              type     = this.attr('name').split('_').pop(),
              rgbRegEx = new RegExp('[^0-9]', 'i'),
              hexKeys  = "0123456789abcdefABCDEF",
              rgbKeys  = "0123456789",
              alphaKeys = "0123456789",
              r, g, b, a;

          switch (type)
          {
            case 'red':
            case 'green':
            case 'blue':
              if (e.type === "keyup" && rgbKeys.indexOf(e.key) === -1)
              {
                return;
              }

              r = $r.val().replace(rgbRegEx, '');
              r = (!r) ? 0 : parseInt(r);

              g = $g.val().replace(rgbRegEx, '');
              g = (!g) ? 0 : parseInt(g);

              b = $b.val().replace(rgbRegEx, '');
              b = (!b) ? 0 : parseInt(b);

              $r.val(r);
              $g.val(g);
              $b.val(b);

              $proxy.minicolors('value', '#' +
                ('00' + r.toString(16)).slice(-2) +
                ('00' + g.toString(16)).slice(-2) +
                ('00' + b.toString(16)).slice(-2)
              );
              break;

            case 'alpha':
              if (e.type === "keyup" && alphaKeys.indexOf(e.key) === -1)
              {
                return;
              }

              a = this.val().replace(new RegExp('[^0-9.,]', 'i'), '');
              a = (!a) ? 1 : parseFloat(a);

              if ( a < 0 ) { a = 0; }
              if ( a > 1 ) { a = 1; }

              this.val(a);
              $proxy.minicolors('opacity', a);
              break;

            case 'hex':
              if (e.type === "keyup" && hexKeys.indexOf(e.key) !== -1 && this.val().length === 6)
              {
                $proxy.minicolors('value', '#' + this.val());
              }
              else if (e.type === "change" || e.type === "focusout")
              {
                $proxy.minicolors('value', '#' + this.val());
              }
              break;
          }
        }
      });


      $('.colorFieldControls .colorMode').entwine({
        onmatch: function(){},
        onunmatch: function(){},

        onchange: function(e){
          var $parent = this.closest('.field.color'),
              $proxy  = $parent.find('.colorFieldProxy');

          $proxy.minicolors('settings', {control: this.val()});
        }
      });


    }); // colymba namespace
  }); // ss namespace
}(jQuery));

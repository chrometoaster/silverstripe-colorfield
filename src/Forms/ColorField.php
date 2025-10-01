<?php

namespace Colymba\ColorField;

use SilverStripe\Forms\DropdownField;
use SilverStripe\Forms\FormField;
use SilverStripe\Forms\HiddenField;
use SilverStripe\Forms\NumericField;
use SilverStripe\Forms\TextField;
use SilverStripe\ORM\FieldType\DBField;
use SilverStripe\View\Requirements;

/**
 * ColorField - Advanced Color Picker Form Field
 * 
 * A comprehensive color picker form field that provides multiple ways to input
 * and edit color values. This field implements JQuery Minicolors for the main
 * color picker interface and provides individual HEX, RGB, and Alpha input
 * fields for precise color control.
 * 
 * Key Features:
 * - JQuery Minicolors integration for visual color selection
 * - Individual HEX, RGB, and Alpha input fields for precise control
 * - Bi-directional synchronization between all color formats
 * - Live color preview that updates in real-time
 * - Configurable field states (editable/read-only)
 * - Input validation and range clamping
 * - Support for opacity/alpha values
 * 
 * The field can be configured to prioritize either the main color picker
 * or the advanced individual fields for editing, with the other serving
 * as a reference or cross-check.
 * 
 * @package Chrometoaster\ColorField\Forms
 * @author Thierry Francois @colymba
 * @author Chrometoaster (enhanced for SilverStripe 4.9+)
 * @since 1.0.0
 */
class ColorField extends FormField
{
    /**
     * Field's max length RRGGBBAAA.
     *
     * @var int
     */
    protected $maxLength = 9;

    /**
     * JQuery Minicolors plugin config
     * https://github.com/claviska/jquery-minicolors.
     *
     * @var array
     */
    protected $jsConfig = [
      'animationSpeed' => 50,
      'animationEasing' => 'swing',
      'change' => null,
      'changeDelay' => 0,
      'control' => 'hue',
      'defaultValue' => '',
      'hide' => null,
      'hideSpeed' => 100,
      'letterCase' => 'lowercase',
      'opacity' => true,
      'position' => 'bottom left',
      'show' => null,
      'showSpeed' => 100,
      'theme' => 'default',
    ];

    /**
     * JQuery Minicolors plugin config overrides.
     *
     * @var array
     */
    protected $jsConfigOverrides = [
      'inline' => false,
      'control' => 'hue',
    ];

    /**
     * Whether advanced fields (HEX, RGB, Alpha) should be editable
     * 
     * When true, users can directly edit the individual HEX, RGB, and Alpha
     * input fields. When false, these fields are read-only and serve only
     * as display/reference fields.
     * 
     * @var bool
     */
    protected $advancedFieldsEditable = false;

    /**
     * Whether the main color field should be read-only
     * 
     * When true, the main color picker field becomes read-only and serves
     * as a reference/cross-check. When false, it remains editable as the
     * primary color input method.
     * 
     * @var bool
     */
    protected $mainFieldReadonly = false;

    /**
     * Return a new ColorField.
     *
     * @param string $name     Field's name
     * @param string $title    Field's title
     * @param string $value    Field's value
     * @param array  $jsConfig JQuery Minicolors plugin config
     */
    public function __construct($name, $title = null, $value = null, $jsConfig = [])
    {
        $this->jsConfig = array_merge($this->jsConfig, $jsConfig);

        parent::__construct($name, $title, $value);
    }

    /**
     * Set whether advanced fields (HEX, RGB, Alpha) should be editable
     * 
     * This method controls whether users can directly edit the individual
     * HEX, RGB, and Alpha input fields. When enabled, these fields become
     * the primary editing interface with bi-directional synchronization.
     * 
     * @param bool $editable Whether advanced fields should be editable
     * @return $this Fluent interface
     */
    public function setAdvancedFieldsEditable($editable = true)
    {
        $this->advancedFieldsEditable = $editable;
        return $this;
    }

    /**
     * Set whether the main color field should be read-only
     * 
     * This method controls whether the main color picker field is editable
     * or read-only. When set to read-only, it serves as a reference/cross-check
     * while the advanced fields handle the actual editing.
     * 
     * @param bool $readonly Whether the main field should be read-only
     * @return $this Fluent interface
     */
    public function setMainFieldReadonly($readonly = true)
    {
        $this->mainFieldReadonly = $readonly;
        return $this;
    }

    /**
     * Returns the field's HTML attributes
     * 
     * Generates HTML attributes for the main color input field, including
     * the readonly attribute when the main field is configured as read-only.
     * 
     * @return array HTML attributes for the input field
     */
    public function getAttributes()
    {
        $attributes = [
            'size' => $this->maxLength,
            'class' => 'text colorField',
        ];

        // Add readonly attribute if main field is configured as read-only
        if ($this->mainFieldReadonly) {
            $attributes['readonly'] = 'readonly';
        }

        return array_merge(
          parent::getAttributes(),
          $attributes
        );
    }

    /**
     * Return the JQuery Minicolors plugin config.
     *
     * @return array Minicolors plugin config
     */
    public function getJSConfig()
    {
        return $this->jsConfig;
    }

    /**
     * Sets a JQuery Minicolors plugin config option.
     *
     * @param string $key Config name
     * @param mixed  $val Config value
     */
    public function setJSConfig($key, $val)
    {
        $this->jsConfig[$key] = $val;

        return $this;
    }

    /**
     * Generate the field HTML for template rendering
     * 
     * This method sets up all the necessary JavaScript and CSS requirements,
     * processes the color value into its components, and creates the individual
     * form fields for HEX, RGB, and Alpha editing. It also configures the
     * field states based on the advancedFieldsEditable and mainFieldReadonly
     * properties.
     * 
     * The method handles:
     * - Loading JQuery Minicolors and custom JavaScript/CSS
     * - Converting color values to individual components
     * - Creating individual input fields with proper state configuration
     * - Setting up template data for rendering
     * 
     * @param mixed $properties Additional properties for template rendering
     * @return string Rendered field HTML
     */
    public function Field($properties = [])
    {
        // Load required JavaScript libraries
        Requirements::javascript('silverstripe/admin:thirdparty/jquery/jquery.js');
        Requirements::javascript('silverstripe/admin:thirdparty/jquery-entwine/dist/jquery.entwine-dist.js');

        // Load JQuery Minicolors plugin
        Requirements::javascript(COLORFIELD . '/client/dist/thirdparty/jquery-minicolors/jquery.minicolors.js');
        Requirements::css(COLORFIELD . '/client/dist/thirdparty/jquery-minicolors/jquery.minicolors.css');

        // Load custom ColorField JavaScript and CSS
        Requirements::javascript(COLORFIELD . '/client/dist/js/ColorField.js');
        Requirements::css(COLORFIELD . '/client/dist/css/ColorField.css');

        // Merge JavaScript configuration with overrides
        $jsConfig = array_merge($this->jsConfig, $this->jsConfigOverrides);
        
        // Create DBColor field instance and extract color components
        $color = DBField::create_field('Chrometoaster\ColorField\DBColor', $this->Value(), 'Color');
        $id = $this->ID();
        $hex = $color->Hex();
        $red = $color->R();
        $green = $color->G();
        $blue = $color->B();
        $alpha = $color->Alpha();

        // Disable alpha if opacity is not supported
        if (!$jsConfig['opacity']) {
            $alpha = 1;
        }

        // Prepare template data
        $data = [
            // JavaScript configuration for Minicolors plugin
            'JSConfig' => htmlspecialchars(json_encode($jsConfig)),
            
            // Template options
            'Options' => [
                'Alpha' => $this->jsConfig['opacity'],
            ],
            
            // Current color values for display
            'Color' => [
                'Hex' => $hex,
                'R' => $red,
                'G' => $green,
                'B' => $blue,
                'A' => $alpha,
            ],
            
            // Individual input fields for advanced editing
            'Controls' => [
                // HEX input field
                'HexDisplay' => TextField::create($id.'_hex_display', 'Hex', $hex, 6)
                    ->setReadonly(!$this->advancedFieldsEditable)
                    ->addExtraClass($this->advancedFieldsEditable ? 'hex-display' : 'no-change-track hex-display'),

                // Red component input field
                'RedDisplay' => NumericField::create($id.'_red_display', 'R', $red, 3)
                    ->setReadonly(!$this->advancedFieldsEditable)
                    ->addExtraClass($this->advancedFieldsEditable ? 'red-display' : 'no-change-track red-display'),

                // Green component input field
                'GreenDisplay' => NumericField::create($id.'_green_display', 'G', $green, 3)
                    ->setReadonly(!$this->advancedFieldsEditable)
                    ->addExtraClass($this->advancedFieldsEditable ? 'green-display' : 'no-change-track green-display'),

                // Blue component input field
                'BlueDisplay' => NumericField::create($id.'_blue_display', 'B', $blue, 3)
                    ->setReadonly(!$this->advancedFieldsEditable)
                    ->addExtraClass($this->advancedFieldsEditable ? 'blue-display' : 'no-change-track blue-display'),

                // Alpha/opacity input field
                'AlphaDisplay' => TextField::create($id.'_alpha_display', 'Alpha', $alpha, 5)
                    ->setReadonly(!$this->advancedFieldsEditable)
                    ->addExtraClass($this->advancedFieldsEditable ? 'alpha-display' : 'no-change-track alpha-display'),
            ],
            // Note: HSV fields are commented out as they're not currently used
            // but could be added for additional color space support
            /*
            'Hue' => NumericField::create($id . '_hue', '', $hue, 3)
                ->addExtraClass('no-change-track'),

            'Saturation' => NumericField::create($id . '_saturation', '', $saturation, 3)
                ->addExtraClass('no-change-track'),

            'Brightness' => NumericField::create($id . '_brightness', '', $brightness, 3)
                ->addExtraClass('no-change-track'),
            */
        ];

        // Render the field using the ColorField template with prepared data
        return $this->customise($data)->renderWith('ColorField');
    }
}

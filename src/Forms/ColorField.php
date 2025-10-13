<?php

namespace Colymba\ColorField\Forms;

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
 * A comprehensive color picker form field for SilverStripe 5+ that provides
 * multiple ways to input and edit color values using the Pickr color picker library.
 * 
 * Key Features:
 * - Pickr color picker integration (vanilla JavaScript, no jQuery)
 * - Individual HEX, RGB, and Alpha input fields for precise control
 * - Bi-directional synchronization between all color formats
 * - Live color preview with transparency grid
 * - Support for opacity/alpha values (0-1)
 * - RRGGBBAAA database format (6 hex digits + 3 digit alpha 0-100)
 * 
 * @package Colymba\ColorField\Forms
 * @author Thierry Francois @colymba
 * @author Chrometoaster (SS5 + Pickr compatibility)
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
     * Pickr color picker config
     * https://github.com/Simonwep/pickr
     *
     * @var array
     */
    protected $jsConfig = [
        'theme' => 'nano',
        'default' => '',
        'opacity' => true,
        'control' => 'hue',
    ];

    /**
     * Pickr color picker config overrides.
     *
     * @var array
     */
    protected $jsConfigOverrides = [
        'inline' => true,
    ];

    /**
     * Return a new ColorField.
     *
     * @param string $name     Field's name
     * @param string $title    Field's title
     * @param string $value    Field's value
     * @param array  $jsConfig Pickr color picker plugin config
     */
    public function __construct($name, $title = null, $value = null, $jsConfig = [])
    {
        $this->jsConfig = array_merge($this->jsConfig, $jsConfig);

        parent::__construct($name, $title, $value);
    }

    /**
     * Returns the field's HTML attributes.
     *
     * @return array HTML attributes
     */
    public function getAttributes()
    {
        return array_merge(
            parent::getAttributes(),
            [
                'size' => $this->maxLength,
                'class' => 'text colorField',
            ]
        );
    }

    /**
     * Return the Pickr color picker config.
     *
     * @return array Pickr plugin config
     */
    public function getJSConfig()
    {
        return $this->jsConfig;
    }

    /**
     * Sets a Pickr color picker config option.
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
     * Return's the field for the template.
     *
     * @param mixed $properties
     *
     * @return string
     */
    public function Field($properties = [])
    {
        // Load Pickr color picker library
        Requirements::javascript('colymba/colorfield:client/dist/thirdparty/pickr/pickr.min.js');
        Requirements::css('colymba/colorfield:client/dist/thirdparty/pickr/pickr.min.css');

        // Load custom ColorField JavaScript and CSS
        Requirements::javascript('colymba/colorfield:client/dist/js/ColorField.js');
        Requirements::css('colymba/colorfield:client/dist/css/ColorField.css');

        $jsConfig = array_merge($this->jsConfig, $this->jsConfigOverrides);
        $color = DBField::create_field('Colymba\ColorField\Fields\DBColor', $this->Value());
        $id = $this->ID();
        $hex = $color->Hex();
        $red = $color->R();
        $green = $color->G();
        $blue = $color->B();
        $alpha = $color->Alpha();

        if (!$jsConfig['opacity']) {
            $alpha = 1;
        }

        $data = [
            'JSConfig' => json_encode($jsConfig),
            'Options' => [
                'Alpha' => $this->jsConfig['opacity'],
            ],
            'Color' => [
                'Hex' => $hex,
                'R' => $red,
                'G' => $green,
                'B' => $blue,
                'A' => $alpha,
            ],
            'Controls' => [
                'Mode' => DropdownField::create(
                    $id.'_mode',
                    $jsConfig['control'],
                    [
                        'hue' => 'Hue',
                        'brightness' => 'Brightness',
                        'saturation' => 'Saturation',
                        'wheel' => 'Wheel',
                    ]
                )->addExtraClass('no-change-track colorMode'),

                'Proxy' => HiddenField::create($id.'_proxy', '', $hex)
                    ->addExtraClass('no-change-track colorFieldProxy')
                    ->setAttribute('data-opacity', $alpha),

                'Hex' => TextField::create($id.'_hex', '', $hex, 6)
                    ->addExtraClass('no-change-track hex'),

                'Red' => NumericField::create($id.'_red', '', $red, 3)
                    ->addExtraClass('no-change-track mode_wheel r'),

                'Green' => NumericField::create($id.'_green', '', $green, 3)
                    ->addExtraClass('no-change-track mode_wheel g'),

                'Blue' => NumericField::create($id.'_blue', '', $blue, 3)
                    ->addExtraClass('no-change-track mode_wheel b'),

                'Alpha' => TextField::create($id.'_alpha', '', $alpha, 3) //using TextField so 'step' can be overriden
                    ->setAttribute('min', 0)
                    ->setAttribute('max', 1)
                    ->setAttribute('step', '0.01')
                    ->setAttribute('type', 'number')
                    ->addExtraClass('no-change-track alpha'),
            ],
        ];

        return $this->customise($data)->renderWith('ColorField');
    }
}


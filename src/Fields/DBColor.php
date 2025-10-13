<?php

namespace Colymba\ColorField\Fields;

use SilverStripe\ORM\DB;
use SilverStripe\ORM\FieldType\DBField;
use Colymba\ColorField\Forms\ColorField;

/**
 * DBField for Color manipulation and DB storage.
 *
 * Colors are stored in the DB as RRGGBBAAA:
 * Hex RGB value + 3 digit Alpha
 * AAA = [0,100] : 100 = 1 alpha / 001 = 0.01 alpha
 *
 * @author Thierry Francois @colymba
 * @author Chrometoaster (SS5 compatibility)
 */
class DBColor extends DBField
{
    /**
     * Color Hexadecimal value.
     *
     * @var string
     */
    protected $hex; // RRGGBB

    /**
     * Decimal 0-1 Alpha value.
     *
     * @var float
     */
    protected $alpha; // X.X

    /**
     * DBField constructor.
     *
     * @param string $name Field name
     */
    public function __construct($name = null)
    {
        $this->defaultVal = '000000100';

        parent::__construct($name);
    }

    /**
     * (non-PHPdoc).
     *
     * @see DBField::requireField()
     */
    public function requireField()
    {
        $parts = [
            'datatype' => 'varchar',
            'precision' => 9,
            'character set' => 'utf8',
            'collate' => 'utf8_general_ci',
            'arrayValue' => $this->arrayValue,
        ];

        $values = [
            'type' => 'varchar',
            'parts' => $parts,
        ];

        DB::require_field($this->tableName, $this->name, $values);
    }

    /**
     * (non-PHPdoc).
     *
     * @see DBField::scaffoldFormField()
     *
     * @param null|mixed $title
     * @param null|mixed $params
     */
    public function scaffoldFormField($title = null, $params = null)
    {
        $field = ColorField::create($this->name, $title);

        return $field;
    }

    /**
     * Returns the value to be set in the database to blank this field.
     */
    public function nullValue()
    {
        return null;
    }

    /**
     * Sets the field's value
     * and sync Hex and Alpha properties.
     *
     * @param string $value       Field's value (RRGGBBAAA)
     * @param mixed  $record      Associated record
     * @param mixed  $markChanged
     */
    public function setValue($value, $record = null, $markChanged = true)
    {
        $value = $this->formatValue($value);

        $this->value = $value;
        $this->hex = $this->extractHex($value);
        $this->alpha = (int) ($this->extractAlpha($value)) / 100;
    }

    /**
     * Sets the field's RGB value in Hex format.
     *
     * @param string $hex RGB or RRGGBB Hex value
     */
    public function setHex($hex)
    {
        $this->hex = self::format_hex($hex);
        $this->syncValue();

        return $this;
    }

    /**
     * Return the Hex representation of the color.
     *
     * @return string Hex value
     */
    public function Hex()
    {
        return $this->hex;
    }

    /**
     * Sets the field's Alpha value.
     *
     * @param float $alpha Alpha value between 0 and 1 (e.g. 0.55)
     */
    public function setAlpha($alpha)
    {
        $this->alpha = $alpha;
        $this->syncValue();

        return $this;
    }

    /**
     * Return the Alpha value or the color.
     *
     * @return float Alpha value
     */
    public function Alpha()
    {
        return number_format($this->alpha, 2);
    }

    /**
     * Return an RGB array representation of this color.
     *
     * @return array Associative RGB array
     */
    public function RGB()
    {
        return self::hex_to_rgb($this->hex);
    }

    /**
     * Return the decimal Red component of the color.
     *
     * @return int Red value
     */
    public function R()
    {
        $rgb = self::hex_to_rgb($this->hex);

        return $rgb['R'];
    }

    /**
     * Return the decimal Green component of the color.
     *
     * @return int Green value
     */
    public function G()
    {
        $rgb = self::hex_to_rgb($this->hex);

        return $rgb['G'];
    }

    /**
     * Return the decimal Blue component of the color.
     *
     * @return int Blue value
     */
    public function B()
    {
        $rgb = self::hex_to_rgb($this->hex);

        return $rgb['B'];
    }

    /**
     * Return a correctly formatted Hex value RRGGBB.
     *
     * @param string $hex Possible Hex value
     *
     * @return string RRGGBB hex value
     */
    public static function format_hex($hex)
    {
        if (\strlen($hex) < 6) {
            $r = substr($hex, 0, 1);
            $g = substr($hex, 1, 1);
            $b = substr($hex, 2, 1);

            return $r.$r.$g.$g.$b.$b;
        }

        return $hex;
    }

    /**
     * Convert and Hex color into RGB decimal components.
     *
     * @param string $hex Hex color value
     *
     * @return array Associative RGB array
     */
    public static function hex_to_rgb($hex)
    {
        $hex = self::format_hex($hex);

        return [
            'R' => hexdec(substr($hex, 0, 2)),
            'G' => hexdec(substr($hex, 2, 2)),
            'B' => hexdec(substr($hex, 4, 2)),
        ];
    }

    /**
     * Convert RGB color component int an Hex color string.
     *
     * @param int $r Red component
     * @param int $g Green component
     * @param int $b Blue component
     *
     * @return string RRGGBB Hex value
     */
    public static function rgb_to_hex($r, $g, $b)
    {
        $r = str_pad(dechex($r), 2, '0', STR_PAD_LEFT);
        $g = str_pad(dechex($g), 2, '0', STR_PAD_LEFT);
        $b = str_pad(dechex($b), 2, '0', STR_PAD_LEFT);

        return $r.$g.$b;
    }

    /**
     * Make sure the field's actual value is in an acceptable format
     * or convert's it.
     *
     * @param mixed $value Field's value
     *
     * @return string Correct field's value
     */
    protected function formatValue($value)
    {
        $val = $value;

        if (null === $val || '' === $val || 0 === $val) {
            $val = $this->defaultVal;
        }

        return $val;
    }

    /**
     * Updates the field's value from the Hex and Alpha properties.
     */
    protected function syncValue()
    {
        $hex = $this->hex;
        $alpha = str_pad(($this->alpha * 100), 3, '0', STR_PAD_LEFT);

        $this->value = $hex.$alpha;
    }

    /**
     * Extract the RGB Hex value from a RRGGBBAAA string.
     *
     * @param string $value RGBA String
     *
     * @return string Hex RGB
     */
    protected function extractHex($value)
    {
        return substr($value, 0, 6);
    }

    /**
     * Extract the Alpha value from a RRGGBBAAA string.
     *
     * @param string $value RGBA String
     *
     * @return string Alpha
     */
    protected function extractAlpha($value)
    {
        return substr($value, -3);
    }
}


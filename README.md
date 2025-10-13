# SilverStripe COLOR FIELD

Color picker and DBField for SilverStripe 5.4+ with modern Pickr integration.

## ColorField

The `ColorField` form field implementing a color picker with multiple input methods. Using [Pickr](https://github.com/Simonwep/pickr) - a modern, lightweight, vanilla JavaScript color picker with no dependencies.

![preview](screenshots/preview.png)

## Features

- **Modern Pickr Color Picker** - Vanilla JavaScript, no jQuery dependencies
- **Bi-directional Editing** - Changes in HEX update RGB and vice versa
- **Alpha Channel Support** - Full opacity control (0-1)
- **Multiple Input Methods**:
  - Visual color picker with hue/saturation controls
  - Direct HEX input (6-character format)
  - Individual RGB inputs (0-255 range)
  - Alpha/opacity input (0-1 decimal)
  - Pre-defined color swatches
- **Real-time Preview** - Color preview box with transparency grid
- **RRGGBBAAA Format** - Database storage format (6 hex digits + 3 digit alpha)

## DBColor Field

The `DBColor` DBField for storing and manipulating colors.

### Template Methods
- `$color->Hex()` - Returns hex color (e.g., "ff0000")
- `$color->RGB()` - Returns RGB array
- `$color->R()`, `$color->G()`, `$color->B()` - Individual color components (0-255)
- `$color->Alpha()` - Returns alpha value (0.00-1.00)

### Static Methods
- `DBColor::hex_to_rgb($hex)` - Convert hex to RGB array
- `DBColor::rgb_to_hex($r, $g, $b)` - Convert RGB to hex string
- `DBColor::format_hex($hex)` - Normalize hex format (expands 3-char to 6-char)

### Template Variables
- `$Color.Hex` - Hex value
- `$Color.R`, `$Color.G`, `$Color.B` - RGB components
- `$Color.Alpha` - Alpha value

## Requirements

* SilverStripe 5.4+
* PHP 8.1+

## Installation

### Composer

```bash
composer require "colymba/colorfield:dev-ss5.4-enhanced"
```

### Manual

* Download and copy module to your SilverStripe project

## Usage

### In your DataObject

```php
use Colymba\ColorField\Forms\ColorField;

class MyPage extends Page
{
    private static $db = [
        'BackgroundColor' => 'Colymba\ColorField\Fields\DBColor',
        'AccentColor' => 'Colymba\ColorField\Fields\DBColor',
    ];

    public function getCMSFields()
    {
        $fields = parent::getCMSFields();
        
        // Add color field with alpha/opacity support
        $fields->addFieldToTab('Root.Design', 
            ColorField::create('BackgroundColor', 'Background Color')
                ->setDescription('Select a background color with transparency')
        );
        
        // Add color field without alpha/opacity
        $fields->addFieldToTab('Root.Design', 
            ColorField::create('AccentColor', 'Accent Color')
                ->setDescription('Select an accent color')
                ->setJSConfig('opacity', false) // Disable alpha channel
        );
        
        return $fields;
    }
}
```

### In your templates

```html
<!-- Use the color in CSS -->
<div style="background-color: #{$BackgroundColor.Hex}; opacity: $BackgroundColor.Alpha;">
    Content here
</div>

<!-- Access RGB values -->
<div style="background-color: rgb($BackgroundColor.R, $BackgroundColor.G, $BackgroundColor.B);">
    Content here
</div>
```

## Database Format

Colors are stored in the database as **RRGGBBAAA** (9 characters):
- **RRGGBB** - Hexadecimal RGB value (6 characters)
- **AAA** - Alpha value as percentage (3 digits, range 000-100)

### Examples:
- `ff0000100` = Red at 100% opacity (#ff0000, alpha: 1.0)
- `0000ff050` = Blue at 50% opacity (#0000ff, alpha: 0.5)
- `00ff0025` = Green at 25% opacity (#00ff00, alpha: 0.25)

## Configuration

The ColorField can be configured using the `setJSConfig()` method:

```php
ColorField::create('MyColor', 'Color')
    ->setJSConfig('opacity', false)  // Disable opacity/alpha
    ->setJSConfig('theme', 'nano')   // Pickr theme (nano, classic, monolith)
    ->setJSConfig('inline', true);   // Show picker inline vs popup
```

## Changelog

### 3.0.0 - SilverStripe 5.4 Compatibility
- Updated for SilverStripe 5.4+ compatibility
- Replaced jQuery MiniColors with Pickr color picker
- Removed jQuery dependencies (vanilla JavaScript implementation)
- Migrated from `/code/` to `/src/` folder structure
- Updated to PSR-4 autoloading
- Enhanced UX with bi-directional HEX/RGB editing
- Added real-time color preview with transparency grid
- Maintained backward-compatible RRGGBBAAA database format

## License (BSD Simplified)

Copyright (c) 2013, Thierry Francois (colymba)
Copyright (c) 2025, Chrometoaster (SS5 update)

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of Thierry Francois, colymba nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

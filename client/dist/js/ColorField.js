/**
 * ColorField JavaScript for SilverStripe CMS 5.4+
 * Vanilla JavaScript implementation using Pickr color picker
 * Maintains bi-directional RGB/HEX editing and RRGGBBAAA format compatibility
 * 
 * @author Chrometoaster
 * @author Thierry Francois @colymba
 */

(function() {
    'use strict';

    // Utility functions
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function padHex(hex) {
        // Expand 3-character hex to 6-character
        if (hex.length === 3) {
            return hex.split('').map(char => char + char).join('');
        }
        return hex;
    }

    function updateHiddenField(fieldId, hex, alpha) {
        const hiddenField = document.getElementById(fieldId);
        if (hiddenField) {
            const cleanHex = hex.replace('#', '');
            const paddedHex = padHex(cleanHex);
            const alphaValue = Math.round(alpha * 100).toString().padStart(3, '0');
            hiddenField.value = paddedHex + alphaValue;
        }
    }

    function syncFromPicker(pickrInstance, color, parentElement) {
        if (!color || !parentElement) return;
        
        const hex = color.toHEXA().toString();
        const rgba = color.toRGBA();
        const parent = parentElement;

        // Update hex input
        const hexInput = parent.querySelector('.hex input');
        if (hexInput) {
            hexInput.value = hex.replace('#', '').toUpperCase();
        }

        // Update RGB inputs
        const redInput = parent.querySelector('input.r, input.mode_wheel.r');
        const greenInput = parent.querySelector('input.g, input.mode_wheel.g');
        const blueInput = parent.querySelector('input.b, input.mode_wheel.b');
        
        if (redInput) redInput.value = Math.round(rgba[0]);
        if (greenInput) greenInput.value = Math.round(rgba[1]);
        if (blueInput) blueInput.value = Math.round(rgba[2]);

        // Update alpha input
        const alphaInput = parent.querySelector('.alpha input');
        if (alphaInput) {
            alphaInput.value = rgba[3].toFixed(2);
        }

        // Update color preview
        const colorPreview = parent.querySelector('.colorFieldPreview .color');
        if (colorPreview) {
            colorPreview.style.backgroundColor = hex;
            colorPreview.style.opacity = rgba[3];
        }

        // Update hidden field
        const hiddenField = parent.querySelector('.colorField');
        if (hiddenField) {
            updateHiddenField(hiddenField.id, hex, rgba[3]);
        }
    }

    function syncToPicker(pickrInstance, source, parent) {
        if (!pickrInstance || !parent) return;

        let hex, alpha = 1;
        const alphaInput = parent.querySelector('.alpha input');

        if (source === 'hex') {
            const hexInput = parent.querySelector('.hex input');
            if (hexInput && hexInput.value) {
                let hexValue = hexInput.value.replace('#', '');
                hexValue = padHex(hexValue);
                hex = '#' + hexValue;
            }
        } else         if (source === 'rgb') {
            const redInput = parent.querySelector('input.r, input.mode_wheel.r');
            const greenInput = parent.querySelector('input.g, input.mode_wheel.g');
            const blueInput = parent.querySelector('input.b, input.mode_wheel.b');
            
            if (redInput && greenInput && blueInput) {
                const r = Math.max(0, Math.min(255, parseInt(redInput.value) || 0));
                const g = Math.max(0, Math.min(255, parseInt(greenInput.value) || 0));
                const b = Math.max(0, Math.min(255, parseInt(blueInput.value) || 0));
                
                // Update inputs with clamped values
                redInput.value = r;
                greenInput.value = g;
                blueInput.value = b;
                
                hex = rgbToHex(r, g, b);
                
                // Update hex input
                const hexInput = parent.querySelector('.hex input');
                if (hexInput) {
                    hexInput.value = hex.replace('#', '').toUpperCase();
                }
            }
        } else if (source === 'alpha') {
            if (alphaInput) {
                let alphaValue = parseFloat(alphaInput.value);
                if (!isNaN(alphaValue)) {
                    alpha = Math.max(0, Math.min(1, alphaValue));
                    if (alphaInput.value !== alpha.toString()) {
                        alphaInput.value = alpha.toFixed(2);
                    }
                }
            }
            // Don't update color, just alpha
            const currentColor = pickrInstance.getColor();
            if (currentColor) {
                const rgba = currentColor.toRGBA();
                pickrInstance.setColor('rgba(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + alpha + ')');
            }
            
            // Update hidden field and preview
            const hexInput = parent.querySelector('.hex input');
            if (hexInput) {
                const hiddenField = parent.querySelector('.colorField');
                const colorPreview = parent.querySelector('.colorFieldPreview .color');
                if (hiddenField) {
                    updateHiddenField(hiddenField.id, '#' + hexInput.value, alpha);
                }
                if (colorPreview) {
                    colorPreview.style.opacity = alpha;
                }
            }
            return;
        }

        if (hex) {
            if (alphaInput) {
                let alphaValue = parseFloat(alphaInput.value);
                if (!isNaN(alphaValue)) {
                    alpha = Math.max(0, Math.min(1, alphaValue));
                }
            }
            
            // Convert hex to RGB and apply alpha
            const rgb = hexToRgb(hex);
            if (rgb) {
                pickrInstance.setColor('rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')');
            }
            
            // Update hidden field and preview
            const hiddenField = parent.querySelector('.colorField');
            const colorPreview = parent.querySelector('.colorFieldPreview .color');
            if (hiddenField) {
                updateHiddenField(hiddenField.id, hex, alpha);
            }
            if (colorPreview) {
                colorPreview.style.backgroundColor = hex;
                colorPreview.style.opacity = alpha;
            }
        }
    }

    function initializeColorField(element) {
        const parent = element.closest('.field.color');
        if (!parent) return;

        // Check if already initialized
        if (parent.hasAttribute('data-colorfield-initialized')) {
            return;
        }
        parent.setAttribute('data-colorfield-initialized', 'true');

        const pickrContainer = parent.querySelector('.pickr-container');
        
        if (!pickrContainer) return;

        // Parse initial color value from RRGGBBAAA format
        const initialValue = element.value || '000000100';
        const initialHex = '#' + initialValue.substring(0, 6);
        const initialAlpha = parseInt(initialValue.substring(6, 9)) / 100;
        
        // Check if alpha/opacity is enabled by looking for alpha input
        const hasAlphaInput = !!parent.querySelector('.alpha input');

        // Initialize Pickr
        const pickr = Pickr.create({
            el: pickrContainer,
            theme: 'nano',
            default: 'rgba(' + parseInt(initialHex.substring(1, 3), 16) + ',' + 
                             parseInt(initialHex.substring(3, 5), 16) + ',' + 
                             parseInt(initialHex.substring(5, 7), 16) + ',' + 
                             initialAlpha + ')',
            inline: true,
            swatches: [
                '#f44336', '#e91e63', '#9c27b0', '#673ab7',
                '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
                '#009688', '#4caf50', '#8bc34a', '#cddc39',
                '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
            ],
            components: {
                preview: true,
                opacity: hasAlphaInput,
                hue: true,
                interaction: {
                    hex: false,
                    rgba: false,
                    hsla: false,
                    hsva: false,
                    cmyk: false,
                    input: false,
                    clear: false,
                    save: false
                }
            }
        });

        // Handle color changes from picker
        pickr.on('change', (color) => {
            syncFromPicker(pickr, color, parent);
        });

        // Handle input field changes
        const hexInput = parent.querySelector('.hex input');
        const redInput = parent.querySelector('input.r, input.mode_wheel.r');
        const greenInput = parent.querySelector('input.g, input.mode_wheel.g');
        const blueInput = parent.querySelector('input.b, input.mode_wheel.b');
        const alphaInput = parent.querySelector('.alpha input');

        if (hexInput) {
            hexInput.addEventListener('input', () => {
                const hexValue = hexInput.value.replace('#', '');
                if (/^[0-9A-Fa-f]{6}$/.test(hexValue)) {
                    syncToPicker(pickr, 'hex', parent);
                }
            });
            hexInput.addEventListener('change', () => {
                const hexValue = hexInput.value.replace('#', '');
                if (/^[0-9A-Fa-f]{3}$/.test(hexValue)) {
                    // Auto-expand 3-char hex
                    hexInput.value = padHex(hexValue).toUpperCase();
                    syncToPicker(pickr, 'hex', parent);
                } else if (/^[0-9A-Fa-f]{6}$/.test(hexValue)) {
                    hexInput.value = hexValue.toUpperCase();
                    syncToPicker(pickr, 'hex', parent);
                }
            });
        }

        if (redInput) {
            redInput.addEventListener('input', () => syncToPicker(pickr, 'rgb', parent));
            redInput.addEventListener('change', () => syncToPicker(pickr, 'rgb', parent));
        }

        if (greenInput) {
            greenInput.addEventListener('input', () => syncToPicker(pickr, 'rgb', parent));
            greenInput.addEventListener('change', () => syncToPicker(pickr, 'rgb', parent));
        }

        if (blueInput) {
            blueInput.addEventListener('input', () => syncToPicker(pickr, 'rgb', parent));
            blueInput.addEventListener('change', () => syncToPicker(pickr, 'rgb', parent));
        }

        if (alphaInput) {
            alphaInput.addEventListener('input', () => syncToPicker(pickr, 'alpha', parent));
            alphaInput.addEventListener('change', () => syncToPicker(pickr, 'alpha', parent));
        }

        // Handle mode dropdown changes (visual only for now)
        const modeSelect = parent.querySelector('.colorMode select');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                // Pickr doesn't have mode switching like minicolors
                // This is kept for potential future enhancements
            });
        }

        // Store pickr instance for cleanup if needed
        element._pickrInstance = pickr;
    }

    function initializeAllColorFields() {
        const colorFields = document.querySelectorAll('.colorField');
        colorFields.forEach(initializeColorField);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAllColorFields);
    } else {
        initializeAllColorFields();
    }

    // Re-initialize on dynamic content changes (for CMS)
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && node.classList.contains('colorField')) {
                            initializeColorField(node);
                        } else if (node.querySelectorAll) {
                            const colorFields = node.querySelectorAll('.colorField');
                            colorFields.forEach(initializeColorField);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

})();


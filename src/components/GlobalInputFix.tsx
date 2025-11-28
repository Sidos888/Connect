"use client";

import { useEffect } from 'react';

/**
 * GlobalInputFix - Fixes iOS Safari capitalization inversion bug
 * Intercepts keyboard events to correct iOS's inverted capitalization
 */
export default function GlobalInputFix() {
  useEffect(() => {
    // Only run on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) return;

    // Fix all inputs and textareas
    const fixInput = (input: HTMLInputElement | HTMLTextAreaElement) => {
      try {
        // Skip if already fixed (check for handler marker)
        if ((input as any)._iosFixed) {
          return;
        }
        
        // Don't force autocapitalize - let iOS use default behavior (sentences for textareas, none for inputs)
        // Only set autocapitalize if it's not already set by the component
        if (!input.hasAttribute('autocapitalize')) {
          // For textareas, use 'sentences' (normal iOS behavior)
          // For inputs, use 'off' (prevents unwanted capitalization)
          if (input.tagName === 'TEXTAREA') {
            input.setAttribute('autocapitalize', 'sentences');
          } else {
            input.setAttribute('autocapitalize', 'off');
          }
        }
        
        // Set other attributes
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('spellcheck', 'false');
        
        // Ensure text-transform is none
        input.style.textTransform = 'none';
        
        // Mark as fixed
        (input as any)._iosFixed = true;
      } catch (error) {
        console.warn('GlobalInputFix: Error fixing input:', error);
        return; // Skip this input if there's an error
      }
      
      // Track the last typed character and caps lock state PER INPUT
      let lastKeyPress: { key: string; capsLock: boolean } | null = null;
      
      // Intercept keydown to track what was actually pressed
      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (target !== input) return;
        
        // Track the actual key pressed and caps lock state
        // NOTE: iOS reports caps lock backwards, so we invert it
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
          const reportedCapsLock = e.getModifierState('CapsLock');
          lastKeyPress = {
            key: e.key,
            capsLock: !reportedCapsLock // INVERT because iOS reports it backwards
          };
        } else {
          lastKeyPress = null;
        }
      };
      
      // Intercept input event to correct iOS's inversion
      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (target !== input || !lastKeyPress) {
          lastKeyPress = null;
          return;
        }
        
        const currentValue = target.value;
        const selectionStart = target.selectionStart || 0;
        
        // If we just typed a letter and iOS inverted it, correct it
        if (selectionStart > 0 && lastKeyPress.key.length === 1) {
          const lastChar = currentValue[selectionStart - 1];
          
          // Determine what the character SHOULD be based on caps lock
          const expectedChar = lastKeyPress.capsLock 
            ? lastKeyPress.key.toUpperCase() 
            : lastKeyPress.key.toLowerCase();
          
          // If iOS inverted it (shows opposite case but same letter), correct it
          if (lastChar !== expectedChar && 
              lastChar.toLowerCase() === expectedChar.toLowerCase() &&
              /[a-zA-Z]/.test(lastChar)) {
            
            // Replace the inverted character with the correct one
            const before = currentValue.substring(0, selectionStart - 1);
            const after = currentValue.substring(selectionStart);
            const corrected = before + expectedChar + after;
            
            // Use native setter to update value (bypasses React's controlled component)
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;
            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              'value'
            )?.set;
            
            if (nativeInputValueSetter && target instanceof HTMLInputElement) {
              nativeInputValueSetter.call(target, corrected);
            } else if (nativeTextAreaValueSetter && target instanceof HTMLTextAreaElement) {
              nativeTextAreaValueSetter.call(target, corrected);
            }
            
            // Restore cursor position
            target.setSelectionRange(selectionStart, selectionStart);
            
            // Dispatch input event to notify React of the change
            const inputEvent = new Event('input', { bubbles: true });
            target.dispatchEvent(inputEvent);
          }
        }
        
        lastKeyPress = null;
      };
      
      // Store handlers for cleanup
      (input as any)._iosKeyDownHandler = handleKeyDown;
      (input as any)._iosInputHandler = handleInput;
      
      input.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      input.addEventListener('input', handleInput, { passive: true });
      
      // Also handle focus to ensure attributes are set
      const handleFocus = () => {
        // Don't override autocapitalize if already set by component
        if (!input.hasAttribute('autocapitalize')) {
          if (input.tagName === 'TEXTAREA') {
            input.setAttribute('autocapitalize', 'sentences');
          } else {
            input.setAttribute('autocapitalize', 'off');
          }
        }
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('spellcheck', 'false');
        input.style.textTransform = 'none';
      };
      
      (input as any)._iosFocusHandler = handleFocus;
      input.addEventListener('focus', handleFocus, { passive: true });
    };

    // Fix existing inputs
    const fixAllInputs = () => {
      try {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], textarea');
        inputs.forEach((input) => {
          try {
            fixInput(input as HTMLInputElement | HTMLTextAreaElement);
          } catch (error) {
            console.warn('GlobalInputFix: Error fixing input in fixAllInputs:', error);
          }
        });
      } catch (error) {
        console.error('GlobalInputFix: Error in fixAllInputs:', error);
      }
    };

    // Fix inputs immediately
    fixAllInputs();

    // Watch for new inputs added to the DOM
    // Use requestAnimationFrame to batch mutations and avoid blocking the main thread
    let rafScheduled = false;
    const pendingMutations: MutationRecord[] = [];
    
    const processMutations = () => {
      try {
        const mutations = [...pendingMutations];
        pendingMutations.length = 0;
        rafScheduled = false;
        
        mutations.forEach((mutation) => {
          try {
            // Handle new nodes
            mutation.addedNodes.forEach((node) => {
              try {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;
                  // Check if the added node is an input/textarea
                  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    fixInput(element as HTMLInputElement | HTMLTextAreaElement);
                  }
                  // Check for inputs/textareas inside the added node
                  const inputs = element.querySelectorAll?.('input[type="text"], input[type="email"], input[type="search"], textarea');
                  inputs?.forEach((input) => {
                    try {
                      fixInput(input as HTMLInputElement | HTMLTextAreaElement);
                    } catch (error) {
                      console.warn('GlobalInputFix: Error fixing input in mutation:', error);
                    }
                  });
                }
              } catch (error) {
                console.warn('GlobalInputFix: Error processing added node:', error);
              }
            });
          } catch (error) {
            console.warn('GlobalInputFix: Error processing mutation:', error);
          }
        });
      } catch (error) {
        console.error('GlobalInputFix: Error in processMutations:', error);
      }
    };
    
    const observer = new MutationObserver((mutations) => {
      pendingMutations.push(...mutations);
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(processMutations);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      // Temporarily disable attribute watching - it might be causing performance issues
      // attributes: true,
      // attributeFilter: ['autocapitalize'],
    });

    // Cleanup
    return () => {
      observer.disconnect();
      // Remove event listeners
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach((input) => {
        const keyDownHandler = (input as any)._iosKeyDownHandler;
        const inputHandler = (input as any)._iosInputHandler;
        const focusHandler = (input as any)._iosFocusHandler;
        if (keyDownHandler) {
          input.removeEventListener('keydown', keyDownHandler, true);
          delete (input as any)._iosKeyDownHandler;
        }
        if (inputHandler) {
          input.removeEventListener('input', inputHandler);
          delete (input as any)._iosInputHandler;
        }
        if (focusHandler) {
          input.removeEventListener('focus', focusHandler);
          delete (input as any)._iosFocusHandler;
        }
      });
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from 'react';

/**
 * GlobalInputFix - Fixes iOS Safari capitalization inversion bug
 * Intercepts keyboard events to correct iOS's inverted capitalization
 */
export default function GlobalInputFix() {
  useEffect(() => {
    // Only run on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    console.log('🔧 GlobalInputFix: Initializing', { isIOS, userAgent: navigator.userAgent });
    if (!isIOS) {
      console.log('🔧 GlobalInputFix: Not iOS, skipping');
      return;
    }

    // Fix all inputs and textareas
    const fixInput = (input: HTMLInputElement | HTMLTextAreaElement) => {
      try {
        // Allow specific inputs/textareas to opt out entirely via data attribute
        // This is used for highly controlled fields like the chat message box
        if ((input as any).dataset?.noGlobalInputFix === 'true') {
          console.log('🔧 GlobalInputFix: Skipping input with data-no-global-input-fix', {
            tagName: input.tagName,
            id: input.id,
            className: input.className,
          });
          return;
        }

        // Skip if already fixed (check for handler marker)
        if ((input as any)._iosFixed) {
          return;
        }
        
        // iOS caps lock issue: Even with autocapitalize="sentences", iOS may default to caps lock
        // Solution: For textareas, try removing autocapitalize entirely to let iOS use its true default
        // Only set autocapitalize if it's not already set by the component
        const existingAttr = input.getAttribute('autocapitalize');
        const existingProp = (input as any).autocapitalize;
        const hasExisting = existingAttr !== null || existingProp !== undefined;
        
        console.log('🔧 GlobalInputFix: Processing input', {
          tagName: input.tagName,
          type: (input as HTMLInputElement).type || 'textarea',
          hasAttribute: input.hasAttribute('autocapitalize'),
          existingAttr,
          existingProp,
          hasExisting,
          id: input.id,
          className: input.className
        });
        
        if (!hasExisting) {
          // Set autocapitalize="sentences" for normal sentence capitalization
          // This provides: initial cap at start of sentence, lowercase rest, respects caps lock
          if (input.tagName === 'TEXTAREA') {
            input.setAttribute('autocapitalize', 'sentences');
            console.log('🔧 GlobalInputFix: Textarea - Set autocapitalize="sentences" for normal capitalization');
          } else {
            // For inputs, check if it's a name field (should use "words" instead)
            // If not explicitly set, use "sentences" for normal behavior
            input.setAttribute('autocapitalize', 'sentences');
            console.log('🔧 GlobalInputFix: Input - Set autocapitalize="sentences" for normal capitalization', { tagName: input.tagName });
          }
        } else {
          // If component already set it, respect that setting (e.g., "words" for name fields)
          // Only override if it's set to "off" or removed
          if (existingAttr === 'off' || existingProp === 'off' || existingAttr === '' || existingProp === '') {
            if (input.tagName === 'TEXTAREA') {
              input.setAttribute('autocapitalize', 'sentences');
              console.log('🔧 GlobalInputFix: Textarea - Changed from "off" to "sentences"');
            } else {
              input.setAttribute('autocapitalize', 'sentences');
              console.log('🔧 GlobalInputFix: Input - Changed from "off" to "sentences"');
            }
          } else {
            console.log('🔧 GlobalInputFix: Keeping existing autocapitalize setting', { existingAttr, existingProp });
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
      let lastKeyPress: { key: string; reportedCapsLock: boolean; desiredCase: 'upper' | 'lower' } | null = null;
      
      // Intercept keydown to track what was actually pressed
      const handleKeyDown = (e: any) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (target !== input) return;
        
        // Track the actual key pressed and caps lock state
        // iOS CAPS LOCK INVERSION BUG:
        // - When keyboard shows CAPS (visual caps lock ON), iOS reports capsLock = FALSE
        // - When keyboard shows lowercase (visual caps lock OFF), iOS reports capsLock = TRUE
        // - User wants: When keyboard shows CAPS, type lowercase. When keyboard shows lowercase, type uppercase.
        // - So: If reportedCapsLock is FALSE (keyboard shows CAPS), we want lowercase
        //       If reportedCapsLock is TRUE (keyboard shows lowercase), we want uppercase
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
          const reportedCapsLock = e.getModifierState('CapsLock');
          
          // Determine desired case based on iOS's inverted reporting
          // FALSE = keyboard shows CAPS, user wants lowercase
          // TRUE = keyboard shows lowercase, user wants uppercase
          const desiredCase: 'upper' | 'lower' = reportedCapsLock ? 'upper' : 'lower';
          
          lastKeyPress = {
            key: e.key, // What iOS says was pressed
            reportedCapsLock, // What iOS reports
            desiredCase // What case we actually want
          };
          
          console.log('🔧 GlobalInputFix: KeyDown', {
            reportedKey: e.key,
            reportedCapsLock,
            keyboardShowsCaps: !reportedCapsLock, // Inverted: false means keyboard shows caps
            desiredCase,
            expectedChar: desiredCase === 'upper' ? e.key.toUpperCase() : e.key.toLowerCase()
          });
        } else {
          lastKeyPress = null;
        }
      };
      
      // Track previous value for sentence capitalization
      let previousValue = input.value || '';
      
      // Intercept input event to correct iOS's inversion and handle sentence capitalization
      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (target !== input) {
          lastKeyPress = null;
          return;
        }
        
        const currentValue = target.value;
        const selectionStart = target.selectionStart || 0;
        
        // Check if text was added (not deleted)
        const textWasAdded = currentValue.length > previousValue.length;
        const addedText = textWasAdded ? currentValue.slice(previousValue.length) : '';
        
        let needsCorrection = false;
        let correctedValue = currentValue;
        let newCursorPosition = selectionStart;
        
        // 1. Handle iOS caps lock inversion correction
        if (lastKeyPress && selectionStart > 0 && lastKeyPress.key.length === 1) {
          const lastChar = currentValue[selectionStart - 1];
          
          // Calculate what the character SHOULD be based on desired case
          const expectedChar = lastKeyPress.desiredCase === 'upper' 
            ? lastKeyPress.key.toUpperCase() 
            : lastKeyPress.key.toLowerCase();
          
          // If iOS inverted it (shows opposite case but same letter), correct it
          if (lastChar !== expectedChar && 
              lastChar.toLowerCase() === expectedChar.toLowerCase() &&
              /[a-zA-Z]/.test(lastChar)) {
            
            console.log('🔧 GlobalInputFix: Correcting inverted character', { 
              from: lastChar, 
              to: expectedChar,
              reason: `iOS reported capsLock=${lastKeyPress.reportedCapsLock}, keyboard shows ${lastKeyPress.reportedCapsLock ? 'lowercase' : 'CAPS'}, but typed ${lastChar}, correcting to ${expectedChar}`
            });
            
            // Replace the inverted character with the correct one
            const before = currentValue.substring(0, selectionStart - 1);
            const after = currentValue.substring(selectionStart);
            correctedValue = before + expectedChar + after;
            needsCorrection = true;
          }
        }
        
        // 2. Handle sentence capitalization (only for textareas, and only when text is added)
        if (textWasAdded && input.tagName === 'TEXTAREA' && addedText.length === 1) {
          const textBeforeCursor = correctedValue.slice(0, selectionStart);
          const isSentenceStart = 
            selectionStart === 1 || // First character
            /[.!?]\s*$/.test(textBeforeCursor.slice(0, -1)); // After sentence ending (. ! ?)
          
          // If it's a sentence start and user typed a lowercase letter, capitalize it
          if (isSentenceStart && /[a-z]/.test(addedText)) {
            const capitalized = addedText.toUpperCase();
            const before = correctedValue.slice(0, selectionStart - 1);
            const after = correctedValue.slice(selectionStart);
            correctedValue = before + capitalized + after;
            needsCorrection = true;
            console.log('🔧 GlobalInputFix: Capitalizing sentence start', { 
              from: addedText, 
              to: capitalized,
              position: selectionStart
            });
          }
        }
        
        // Apply corrections if needed
        if (needsCorrection && correctedValue !== currentValue) {
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
            nativeInputValueSetter.call(target, correctedValue);
            } else if (nativeTextAreaValueSetter && target instanceof HTMLTextAreaElement) {
            nativeTextAreaValueSetter.call(target, correctedValue);
            }
            
            // Restore cursor position
            target.setSelectionRange(selectionStart, selectionStart);
            
            // Dispatch input event to notify React of the change
            const inputEvent = new Event('input', { bubbles: true });
            target.dispatchEvent(inputEvent);
        }
        
        // Update previous value for next comparison
        previousValue = target.value;
        lastKeyPress = null;
      };
      
      // Store handlers for cleanup
      (input as any)._iosKeyDownHandler = handleKeyDown;
      (input as any)._iosInputHandler = handleInput;
      
      input.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      input.addEventListener('input', handleInput, { passive: true });
      
      // Also handle focus to ensure attributes are set
      const handleFocus = () => {
        const existingAttr = input.getAttribute('autocapitalize');
        const existingProp = (input as any).autocapitalize;
        const hasExisting = existingAttr !== null || existingProp !== undefined;
        
        console.log('🔧 GlobalInputFix: Focus handler', {
          tagName: input.tagName,
          hasAttribute: input.hasAttribute('autocapitalize'),
          existingAttr,
          existingProp,
          hasExisting
        });
        
        // Ensure autocapitalize="sentences" is set for normal capitalization
        // Only override if it's currently "off" or not set
        const currentAttr = input.getAttribute('autocapitalize');
        const currentProp = (input as any).autocapitalize;
        const isOff = currentAttr === 'off' || currentProp === 'off' || currentAttr === '' || currentProp === '';
        const isNotSet = !currentAttr && currentProp === undefined;
        
        if (isOff || isNotSet) {
          // Don't override if it's explicitly set to "words" (for name fields)
          if (currentAttr !== 'words' && currentProp !== 'words') {
            input.setAttribute('autocapitalize', 'sentences');
            console.log('🔧 GlobalInputFix: Set autocapitalize="sentences" on focus', { tagName: input.tagName });
          }
        } else {
          console.log('🔧 GlobalInputFix: Keeping existing autocapitalize on focus', { currentAttr, currentProp });
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
        console.log('🔧 GlobalInputFix: Found', inputs.length, 'inputs/textareas to fix');
        inputs.forEach((input) => {
          try {
            fixInput(input as HTMLInputElement | HTMLTextAreaElement);
          } catch (error) {
            console.warn('GlobalInputFix: Error fixing input in fixAllInputs:', error);
          }
        });
        console.log('🔧 GlobalInputFix: Finished fixing', inputs.length, 'inputs/textareas');
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

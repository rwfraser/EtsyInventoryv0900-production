/**
 * SKU Generator for myearringadvisor.com
 * 
 * SKU Format: [R][S][T][B][II] (6 characters)
 * - Rack (R): A-Z, a-z, 0-9 (62 options)
 * - Shelf (S): a-t (20 options)
 * - Tray (T): 1-4 (4 options)
 * - Bin (B): a-o (15 options)
 * - Item (II): 01-05 (5 items per bin)
 * 
 * Example: Aa1a01 = Rack A, shelf a, tray 1, bin a, item 01
 * 
 * Total capacity: 62 * 20 * 4 * 15 * 5 = 372,000 locations
 * Current implementation uses: A-B racks, a-t shelves = 12,000 locations
 * 
 * Ported from LocationAdder.py
 */

export interface SKUGenerationResult {
  success: boolean;
  sku?: string;
  error?: string;
}

export class SKUGenerator {
  // Starting SKU when database is empty
  private static readonly STARTING_SKU = 'Aa1a01';
  
  // Maximum SKU (as per LocationAdder.py comments)
  private static readonly MAX_SKU = 'Bt4o05';
  
  /**
   * Validates SKU format
   */
  static validateSKU(sku: string): boolean {
    if (!sku || sku.length !== 6) {
      return false;
    }
    
    const rack = sku[0];
    const shelf = sku[1];
    const tray = sku[2];
    const bin = sku[3];
    const item = sku.substring(4, 6);
    
    // Validate rack: A-Z, a-z, 0-9
    const rackValid = /^[A-Za-z0-9]$/.test(rack);
    
    // Validate shelf: a-t (lowercase only)
    const shelfValid = /[a-t]/.test(shelf);
    
    // Validate tray: 1-4
    const trayValid = /[1-4]/.test(tray);
    
    // Validate bin: a-o (lowercase only)
    const binValid = /[a-o]/.test(bin);
    
    // Validate item: 01-05
    const itemNum = parseInt(item, 10);
    const itemValid = !isNaN(itemNum) && itemNum >= 1 && itemNum <= 5 && /^\d{2}$/.test(item);
    
    return rackValid && shelfValid && trayValid && binValid && itemValid;
  }
  
  /**
   * Generates the next SKU by incrementing the current SKU by 1
   * Ported from LocationAdder.py NextLocation() function
   */
  static nextSKU(currentSKU: string): SKUGenerationResult {
    if (!this.validateSKU(currentSKU)) {
      return { 
        success: false, 
        error: `Invalid SKU format: ${currentSKU}` 
      };
    }
    
    // Extract components
    let rack = currentSKU[0];
    let shelf = currentSKU[1];
    let tray = currentSKU[2];
    let bin = currentSKU[3];
    let item = currentSKU.substring(4, 6);
    
    // Overflow flags
    let carryToBins = false;
    let carryToTrays = false;
    let carryToShelves = false;
    let carryToRack = false;
    
    // Increment item number (01-05, then overflow to bins)
    if (item === '05') {
      item = '01';
      carryToBins = true;
    } else {
      const itemNum = parseInt(item, 10);
      item = (itemNum + 1).toString().padStart(2, '0');
    }
    
    // Increment bin (a-o, then overflow to trays)
    if (carryToBins && bin === 'o') {
      bin = 'a';
      carryToTrays = true;
    } else if (carryToBins) {
      const binCharCode = bin.charCodeAt(0);
      bin = String.fromCharCode(binCharCode + 1);
    }
    
    // Increment tray (1-4, then overflow to shelves)
    if (carryToTrays && tray === '4') {
      carryToShelves = true;
      tray = '1';
    } else if (carryToTrays) {
      const trayNum = parseInt(tray, 10);
      tray = (trayNum + 1).toString();
    }
    
    // Increment shelf (a-t, then overflow to rack)
    if (carryToShelves && shelf === 't') {
      carryToRack = true;
      shelf = 'a';
    } else if (carryToShelves) {
      const shelfCharCode = shelf.charCodeAt(0);
      shelf = String.fromCharCode(shelfCharCode + 1);
    }
    
    // Increment rack (A-Z, a-z, 0-9, then storage full)
    if (rack === '9' && carryToRack) {
      return { 
        success: false, 
        error: 'Storage is full - No location ID available' 
      };
    } else if (carryToRack) {
      const rackCharCode = rack.charCodeAt(0);
      rack = String.fromCharCode(rackCharCode + 1);
    }
    
    const newSKU = rack + shelf + tray + bin + item;
    
    // Validate generated SKU
    if (!this.validateSKU(newSKU)) {
      return { 
        success: false, 
        error: `Generated invalid SKU: ${newSKU}` 
      };
    }
    
    return { success: true, sku: newSKU };
  }
  
  /**
   * Compares two SKUs to determine which has higher magnitude
   * Returns: 1 if sku1 > sku2, -1 if sku1 < sku2, 0 if equal
   */
  static compareSKUs(sku1: string, sku2: string): number {
    if (!this.validateSKU(sku1) || !this.validateSKU(sku2)) {
      throw new Error('Invalid SKU format for comparison');
    }
    
    // Compare each component in order of significance
    for (let i = 0; i < 6; i++) {
      const char1 = sku1[i];
      const char2 = sku2[i];
      
      if (i === 4 || i === 5) {
        // Item number - numeric comparison
        const num1 = parseInt(sku1.substring(4, 6), 10);
        const num2 = parseInt(sku2.substring(4, 6), 10);
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
        break; // Both digits checked
      } else if (i === 2) {
        // Tray - numeric comparison
        const tray1 = parseInt(char1, 10);
        const tray2 = parseInt(char2, 10);
        if (tray1 > tray2) return 1;
        if (tray1 < tray2) return -1;
      } else {
        // Character comparison (rack, shelf, bin)
        if (char1 > char2) return 1;
        if (char1 < char2) return -1;
      }
    }
    
    return 0; // Equal
  }
  
  /**
   * Finds the highest magnitude SKU from an array of SKUs
   */
  static findHighestSKU(skus: string[]): string | null {
    if (!skus || skus.length === 0) {
      return null;
    }
    
    // Filter out invalid SKUs
    const validSKUs = skus.filter(sku => this.validateSKU(sku));
    
    if (validSKUs.length === 0) {
      return null;
    }
    
    // Find highest magnitude
    let highest = validSKUs[0];
    for (let i = 1; i < validSKUs.length; i++) {
      if (this.compareSKUs(validSKUs[i], highest) > 0) {
        highest = validSKUs[i];
      }
    }
    
    return highest;
  }
  
  /**
   * Returns the starting SKU for an empty database
   */
  static getStartingSKU(): string {
    return this.STARTING_SKU;
  }
}

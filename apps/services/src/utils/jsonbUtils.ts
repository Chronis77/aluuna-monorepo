import { logger } from './logger.js';

// Utility functions for handling JSONB data in memory profiles

export interface JsonbArrayField {
  [key: string]: any;
}

// Convert array to JSONB format
export function toJsonbArray(arr: any[] | null | undefined): any {
  if (!arr || !Array.isArray(arr)) {
    return null;
  }
  return arr;
}

// Convert JSONB to array
export function fromJsonbArray(jsonbData: any): any[] {
  if (!jsonbData) {
    return [];
  }
  
  // If it's already an array, return it
  if (Array.isArray(jsonbData)) {
    return jsonbData;
  }
  
  // If it's a string, try to parse it
  if (typeof jsonbData === 'string') {
    try {
      const parsed = JSON.parse(jsonbData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      logger.error('Error parsing JSONB string', { error, data: jsonbData });
      return [];
    }
  }
  
  // If it's an object, try to convert to array
  if (typeof jsonbData === 'object') {
    return Object.values(jsonbData);
  }
  
  return [];
}

// Convert JSONB to string (for text fields that are now JSONB)
export function fromJsonbString(jsonbData: any): string {
  if (!jsonbData) {
    return '';
  }
  
  // If it's already a string, return it
  if (typeof jsonbData === 'string') {
    return jsonbData;
  }
  
  // If it's an array, join it
  if (Array.isArray(jsonbData)) {
    return jsonbData.join(', ');
  }
  
  // If it's an object, stringify it
  if (typeof jsonbData === 'object') {
    return JSON.stringify(jsonbData);
  }
  
  return String(jsonbData);
}

// Convert string to JSONB (for storing text as JSONB)
export function toJsonbString(str: string | null | undefined): any {
  if (!str || str.trim() === '') {
    return null;
  }
  return str;
}

// Convert array to JSONB string (for storing arrays as JSONB)
export function toJsonbStringArray(arr: string[] | null | undefined): any {
  if (!arr || arr.length === 0) {
    return null;
  }
  return arr;
}

// Safely add item to JSONB array
export function addToJsonbArray(existingData: any, newItem: any): any {
  const currentArray = fromJsonbArray(existingData);
  currentArray.push(newItem);
  return currentArray;
}

// Safely remove item from JSONB array by index
export function removeFromJsonbArray(existingData: any, index: number): any {
  const currentArray = fromJsonbArray(existingData);
  if (index >= 0 && index < currentArray.length) {
    currentArray.splice(index, 1);
  }
  return currentArray;
}

// Safely update item in JSONB array by index
export function updateJsonbArrayItem(existingData: any, index: number, newItem: any): any {
  const currentArray = fromJsonbArray(existingData);
  if (index >= 0 && index < currentArray.length) {
    currentArray[index] = newItem;
  }
  return currentArray;
}

// Validate JSONB data structure
export function validateJsonbData(data: any): boolean {
  if (data === null || data === undefined) {
    return true; // null/undefined is valid
  }
  
  if (Array.isArray(data)) {
    return true; // arrays are valid
  }
  
  if (typeof data === 'object') {
    return true; // objects are valid
  }
  
  // Try to parse if it's a string
  if (typeof data === 'string') {
    try {
      JSON.parse(data);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

// Sanitize JSONB data for database storage
export function sanitizeJsonbData(data: any): any {
  if (!validateJsonbData(data)) {
    logger.warn('Invalid JSONB data detected, converting to null', { data });
    return null;
  }
  
  // If it's a string, parse it
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error parsing JSONB string', { error, data });
      return null;
    }
  }
  
  return data;
}

// Create empty JSONB array
export function createEmptyJsonbArray(): any[] {
  return [];
}

// Check if JSONB array is empty
export function isJsonbArrayEmpty(data: any): boolean {
  const array = fromJsonbArray(data);
  return array.length === 0;
}

// Get length of JSONB array
export function getJsonbArrayLength(data: any): number {
  const array = fromJsonbArray(data);
  return array.length;
} 
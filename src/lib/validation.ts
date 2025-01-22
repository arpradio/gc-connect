// lib/validation.ts
import { CIP60FormData, ValidationResult } from '@/types';

export function validateForm(formData: CIP60FormData): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!formData.artists[0]?.name) {
    errors.push('Primary artist name is required');
  }

  // Required fields validation
  if (!formData.releaseTitle) errors.push('Release title is required');
  if (!formData.songTitle) errors.push('Song title is required');
  if (!formData.recordingOwner) errors.push('Recording owner is required');
  if (!formData.isAIGenerated && !formData.compositionOwner) {
    errors.push('Composition owner is required');
  }

  // Check file uploads
  if (!formData.songFile) errors.push('Song file is required');
  if (!formData.coverArtFile) errors.push('Cover art is required');

  // Validate quantity
  if (!formData.quantity || formData.quantity < 1) {
    errors.push('Token mint quantity must be at least 1');
  }

  // Check for valid genre
  if (!formData.genre) {
    errors.push('Primary genre is required');
  }

  // Validate artists
  [...formData.artists, ...formData.featuredArtists].forEach((artist, index) => {
    if (!artist.name.trim()) {
      errors.push(`Artist ${index + 1} name is required`);
    }
  });

  // Validate contributing artists if any
  formData.contributingArtists.forEach((artist, index) => {
    if (!artist.name.trim()) {
      errors.push(`Contributing artist ${index + 1} name is required`);
    }
    if (artist.roles.length === 0) {
      errors.push(`Contributing artist ${index + 1} must have at least one role`);
    }
  });

  // Validate authors if not AI generated and if there are any
  if (!formData.isAIGenerated && formData.authors.length > 0) {
    formData.authors.forEach((author, index) => {
      if (!author.name.trim()) {
        errors.push(`Author ${index + 1} name is required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
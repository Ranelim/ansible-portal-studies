import { useEffect, useState } from 'react';
import {
  readExperienceReturnChrome,
  subscribeExperienceReturnChrome,
  writeExperienceReturnChrome,
  type ExperienceReturnChrome,
} from './experienceReturnChrome';

/** Shared across masthead waffle + rail return + magenta compare bar. */
export function useExperienceReturnChrome() {
  const [variant, setVariant] = useState<ExperienceReturnChrome>(
    readExperienceReturnChrome,
  );

  useEffect(() => subscribeExperienceReturnChrome(() => {
    setVariant(readExperienceReturnChrome());
  }), []);

  const setChrome = (next: ExperienceReturnChrome) => {
    writeExperienceReturnChrome(next);
    setVariant(next);
  };

  return { variant, setChrome };
}

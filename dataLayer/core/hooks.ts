import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

// react-redux 9 `.withTypes` — replaces the old hand-written `TypedUseSelectorHook` cast.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

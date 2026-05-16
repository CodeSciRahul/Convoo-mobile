import { cn } from '@/lib/utils';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { BackHandler, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface BottomSheetProps {
  /**
   * The content to render inside the bottom sheet
   */
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  /**
   * Initial snap point index (defaults to 1, which is typically '50%')
   */
  initialSnapIndex?: number;
  /**
   * Whether to show the handle/indicator bar at the top (defaults to true)
   */
  showHandle?: boolean;
  /**
   * Enable pan down to close gesture (defaults to true)
   */
  enablePanDownToClose?: boolean;
  /**
   * Custom className for the bottom sheet content container
   */
  className?: string;
  /**
   * Custom className for the handle indicator
   */
  handleClassName?: string;
  /**
   * Background color for the backdrop overlay (defaults to 'rgba(0, 0, 0, 0.5)')
   */
  backdropColor?: string;
  /**
   * Whether to show backdrop (defaults to true)
   */
  showBackdrop?: boolean;
  /**
   * Whether the bottom sheet can be dismissed by tapping the backdrop (defaults to true)
   */
  backdropDismissible?: boolean;
}

export interface BottomSheetRef {
  present: () => void;
  dismiss: () => void;
  snapToIndex: (index: number) => void;
}

/**
 * A beautiful, reusable bottom sheet component
 * 
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * 
 * <BottomSheetComponent open={open} onClose={() => setOpen(false)}>
 *   <View className="p-4">
 *     <Text>Your content here</Text>
 *   </View>
 * </BottomSheetComponent>
 * ```
 */
export const BottomSheetComponent = forwardRef<BottomSheetRef, BottomSheetProps>(
  ({children,
    snapPoints = ['25%', '50%', '90%'],
    initialSnapIndex = 1,
    showHandle = true,
    enablePanDownToClose = true,
    className,
    handleClassName,
    backdropColor = 'rgba(0, 0, 0, 0.5)',
    showBackdrop = true,
    backdropDismissible = true}, ref) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  const [isOpen, setIsOpen] = useState(false);
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useImperativeHandle(ref, () => ({
    present: () => {
      bottomSheetModalRef.current?.present();
      setIsOpen(true);
    },
    dismiss: () => {
      bottomSheetModalRef.current?.dismiss();
      setIsOpen(false);
    },
    snapToIndex: (index: number) => bottomSheetModalRef.current?.snapToIndex(index),
  }) );

  const renderBackdrop = useCallback(
    (props: any) => {
      if (!showBackdrop) return null;

      return (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior={backdropDismissible ? 'close' : 'none'}
          style={[
            props.style,
            {
              backgroundColor: backdropColor,
            },
          ]}
        />
      );
    },
    [backdropColor, showBackdrop, backdropDismissible]
  );
  const HandleIndicator = useCallback(() => {
    if (!showHandle) return null;

    return (
      <View className={cn('items-center py-3', handleClassName)}>
        <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </View>
    );
  }, [showHandle, handleClassName]);


  // handle back button press
  useEffect(() => {
    const onBackPress = () => {
      if(isOpen) {
        bottomSheetModalRef.current?.dismiss();
        setIsOpen(false);
        return true
      }
      return false
    }
    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress)
    return () => backHandler.remove()
  }, [isOpen])

  return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={memoizedSnapPoints}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          display: 'none',
        }}
        backgroundStyle={{
          backgroundColor: '#111827',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        style={{
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 20,
        }}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <HandleIndicator />
          <View className={cn('flex-1 bg-white dark:bg-gray-900', className)}>
            {children}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
  );
});

/**
 * Hook to easily manage bottom sheet state
 * 
 * @example
 * ```tsx
 * const { open, onOpen, onClose } = useBottomSheet();
 * 
 * <Button onPress={onOpen}>Open Bottom Sheet</Button>
 * <BottomSheetComponent open={open} onClose={onClose}>
 *   <Text>Your content here</Text>
 * </BottomSheetComponent>
 * ```
 */
export function useBottomSheet() {
  const [open, setOpen] = useState(false);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  return {
    open,
    onOpen,
    onClose
  };
}


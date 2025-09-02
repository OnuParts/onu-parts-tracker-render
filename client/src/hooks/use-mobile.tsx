import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkIsMobile = () => {
      const width = window.innerWidth
      
      // Only use screen width for mobile detection - more reliable
      const isMobileDevice = width < MOBILE_BREAKPOINT
      
      console.log(`Screen width: ${width}px - Mobile: ${isMobileDevice}`)
      setIsMobile(isMobileDevice)
    }
    
    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return isMobile
}

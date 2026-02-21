/**
 * Check if a navigation item is active based on the current path.
 * - For root path '/', only matches exact '/'
 * - For other paths, matches exact or prefix with trailing slash
 */
export function getIsActive(currentPath: string, itemHref: string): boolean {
  if (itemHref === '/') {
    return currentPath === '/'
  }
  return currentPath === itemHref || currentPath.startsWith(itemHref + '/')
}

/**
 * Check if any child item in a group is active
 */
export function isGroupActive(
  currentPath: string,
  children: Array<{ href: string }>
): boolean {
  return children.some((child) => getIsActive(currentPath, child.href))
}

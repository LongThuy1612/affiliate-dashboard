type Rule = {
  perms: string[];
  routes: string[];
  strict: boolean;
};

/**
 * RouteACL — permission-based route guard, inspired by pl-fe-v2.
 *
 * Usage:
 *   const acl = new RouteACL();
 *   acl.allow(['affiliate:manage'], ['/affiliate/actions']);
 *   acl.isAllowed(['affiliate:read'], '/affiliate/actions'); // false
 *   acl.isAllowed(['affiliate:manage'], '/affiliate/actions'); // true
 *
 * When multiple rules match a pathname the **most specific** (longest route
 * string) wins — preventing a broad parent rule from overriding a narrow
 * child rule.
 *
 * Paths with no registered rule are accessible to any authenticated user.
 */
export class RouteACL {
  private rules: Rule[] = [];

  /**
   * @param perms   Permission strings required for these routes, e.g. ["affiliate:manage"]
   * @param routes  Path prefixes to protect, e.g. ["/affiliate/actions"]
   * @param strict  true = exact match only; false (default) = prefix match
   */
  allow(perms: string[], routes: string[], strict = false) {
    this.rules.push({ perms, routes, strict });
  }

  private matches(pathname: string, route: string, strict: boolean): boolean {
    if (strict) return pathname === route;
    return pathname === route || pathname.startsWith(route + '/');
  }

  /** Find the most specific rule that covers `pathname`, or null if none. */
  private findBestRule(pathname: string): Rule | null {
    let best: Rule | null = null;
    let bestLen = -1;

    for (const rule of this.rules) {
      for (const route of rule.routes) {
        if (this.matches(pathname, route, rule.strict) && route.length > bestLen) {
          best = rule;
          bestLen = route.length;
        }
      }
    }

    return best;
  }

  /**
   * Returns true if `userPerms` satisfies the rule covering `pathname`.
   * Returns true if no rule covers the path (accessible to any logged-in user).
   */
  isAllowed(userPerms: string[], pathname: string): boolean {
    const rule = this.findBestRule(pathname);
    if (!rule) return true; // no rule → any authenticated user may access

    if (userPerms.includes('all:manage')) return true;

    for (const p of rule.perms) {
      const [subject] = p.split(':');
      if (userPerms.includes(`${subject}:manage`)) return true;
      if (userPerms.includes(p)) return true;
    }

    return false;
  }
}

/** Register ACL rules from an array of nav items — mirrors pl-fe's grantPermissions. */
export function grantPermissions(
  items: Array<{ href: string; subject?: string; action?: string }>,
  acl: RouteACL,
) {
  for (const item of items) {
    if (item.href && item.subject && item.action) {
      acl.allow([`${item.subject}:${item.action}`], [item.href]);
    }
  }
}

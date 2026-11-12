self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^\\/rapid-medical(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/|api\\/|uploads\\/|map\\/|favicon.ico|robots.txt|sitemap.xml).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/((?!_next/|api/|uploads/|map/|favicon.ico|robots.txt|sitemap.xml).*)"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()
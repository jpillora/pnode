
$ = (selector, ctx = document) ->
  ctx.querySelector selector

$$ = (selector, ctx = document) ->
  ctx.querySelectorAll selector

create = (nodeType) ->
  document.createElement nodeType

slug = (str) ->
  str.replace(/\W+/g, '-').toLowerCase()

defaults = 
  wrapper: "ul"
  item: "li"

parentsUntil = (start, end) ->
  n = 0
  e = start
  while e and e isnt end
    n++
    e = e.parent
  return n

listen = (elem, event, fn) ->
  elem.addEventListener event, fn

hash = ""
onHashChange = (fn) ->
  check = ->
    next = window.location.hash.substr 1
    return if next is hash
    hash = next
    fn(hash)
  check()
  setInterval check, 100

onHashChange (str) ->
  elem = $ "[data-nav-id=#{str}]"
  elem?.scrollIntoView()

toggleClass = (elem, cls, flag) ->
  clss = elem.className
  clss = if clss then clss.split /\s+/ else []
  if flag is true and cls not in clss
    clss.push cls
  if flag is false and cls in clss
    clss.splice clss.indexOf(cls), 1
  elem.className = clss.join " "


#react to scroll
scrollCheck = ->
  for elem in visited
    toggleClass elem.navAnchor.parentElement, 'active', verge.inViewport(elem)

scrollInit = ->
  for e in visited
    vh = verge.viewportH()
    maxh = 0
    maxe = null
    while e
      if e.clientHeight > maxh
        maxh = e.clientHeight
        maxe = e
      e = e.parentElement
      break if e is document.body.parentElement
  maxe.addEventListener('scroll', scrollCheck)
  return

visited = []

Nav = (navContainer, pageRoot = document.body) ->

  #build each <ul>...<ul>
  build = (pageElem, depth = 0) ->

    wrapper = create defaults.wrapper
    wrapper.className = "nav-depth-#{depth}" 

    for elem in $$("[data-nav]", pageElem)
      #skip
      continue if elem in visited
      visited.push elem

      #get heading
      heading = elem.getAttribute "data-nav"
      unless heading
        for child in elem.children
          if /^h\d$/i.test child.nodeName
            heading = child.innerHTML
            break
      unless heading
        heading = "..."

      id = slug heading

      #auto id
      elem.setAttribute "data-nav-id", id

      #create anchor
      item = create defaults.item
      a = create "a"
      a.href = "#" + id
      a.innerHTML = heading
      item.appendChild a
      elem.navAnchor = a

      #create subnav
      #if has children
      if $("[data-nav]", elem)
        a.appendChild build elem, depth + 1

      wrapper.appendChild item
    return wrapper

  #build root
  wrapper = build pageRoot
  navContainer = $(navContainer) if typeof navContainer is "string"
  navContainer.appendChild wrapper

  #init when ready
  scrollInit()

  #setup nav-links
  for a in $$ "[data-nav-link]", pageRoot
    target = a.getAttribute("data-nav-id") or a.innerHTML
    a.href = "#" + slug target

  #trigger
  onHashChange.hash = null

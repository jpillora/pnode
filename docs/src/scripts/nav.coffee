
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

Nav = (navContainer, pageRoot = document.body) ->

  visited = []

  #build each <ul>...<ul>
  build = (pageElem, depth = 0) ->
    visited.push pageElem

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

      #create subnav
      #if has children
      if $("[data-nav]", elem)
        item.appendChild build elem, depth + 1

      wrapper.appendChild item
    return wrapper


  #build root
  wrapper = build pageRoot

  navContainer = $(navContainer) if typeof navContainer is "string"
  navContainer.appendChild wrapper

  #trigger
  onHashChange.hash = null


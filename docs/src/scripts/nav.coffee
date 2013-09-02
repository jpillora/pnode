
$ = (selector, ctx = document) ->
  ctx.querySelector selector

$$ = (selector, ctx = document) ->
  ctx.querySelectorAll selector

create = (nodeType) ->
  document.createElement nodeType

defaults = 
  wrapper: "ul"
  item: "li"

Nav = (navContainer, pageRoot = document.body) ->

  visited = []

  #build each <ul>...<ul>
  buildWrapper = (pageElem) ->
    visited.push pageElem

    wrapper = create defaults.wrapper
    navs = $$("[data-nav]", pageElem)
    for elem in navs
      #skip
      continue if elem in visited

      item = buildItem elem

      wrapper.appendChild item

    return wrapper

  #build each <li>...<li>
  buildItem = (pageElem) ->
    visited.push pageElem

    item = create defaults.item

    a = create "a"
    a.innerHTML = "Heading"

    item.appendChild a

    # navs = $$("[data-nav]", pageElem)

    return item

  #build root wrapper
  wrapper = buildWrapper pageRoot

  navContainer = $(navContainer) if typeof navContainer is "string"
  navContainer.appendChild wrapper



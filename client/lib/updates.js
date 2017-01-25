import Sock from './sock'
import Emitter from 'component-emitter'
import isNearEdge from './is-near-edge'

const print = s => {console.log(s); return s}

const Updates = new Emitter()
/*
 * Broadcast updates
 */
Sock.on('update', ([loc, vol, att]) => {
  for (let uid in loc) {
    Updates.emit(`location-${uid}`, loc[uid])
    if (uid == Sock.id)
      myLoc = loc[uid]
  }

  for (let uid in vol) {
    Updates.emit(`volume-${uid}`, vol[uid])
  }

  for (let partnerId in att) {
    Updates.emit(`attenuation-for-${partnerId}`, att[partnerId])
  }
})

Sock.on('dimensions', dims => dimensions = dims)

/*
 * Gooey translate stuff
 */

let myLoc = []
let translate = [0, 0]
let dimensions = [window.innerWidth, window.innerHeight]
let transitioning = false
let mac = .1

const getMac = () => transitioning ? mac * .01 : mac

Updates.on('location', ([clientX, clientY]) => {
  Sock.emit('location', [
    Math.min(Math.max(myLoc[0] + ((clientX - translate[0] - 50 - myLoc[0]) * getMac()), 0), dimensions[0]),
    Math.min(Math.max(myLoc[1] + ((clientY - translate[1] - 50 - myLoc[1]) * getMac()), 0), dimensions[1])
  ])

  setTimeout(() => {
    if (
      isNearEdge(myLoc[0], translate[0], window.innerWidth) ||
      isNearEdge(myLoc[1], translate[1], window.innerHeight)
    ) {
      translate = [
        (-1) * myLoc[0] + (window.innerWidth / 2) - 50,
        (-1) * myLoc[1] + (window.innerHeight / 2) - 50
      ]

      transitioning = true
      Updates.emit('translate', translate)

      setTimeout(() => transitioning = false, 1500)
    }
  }, 0)
})

/*
 * Set starting checkpoint location to slight offset of user
 */
Updates.on('checkpoint-new', checkpoint => {
  checkpoint.loc = myLoc.map(num => num + 50)
  Sock.emit('checkpoint-new', checkpoint)
})

export default Updates

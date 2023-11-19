# Presentation

Build slideshow presentations from within Roam!

## Usage

Type `{{presentation}}` or `{{slides}}` in a block. Clicking the button will overlay a presentation directly from Roam! Exit the presentation by hitting 'ESC'.

To specify what content is part of the presentation, create a child block for each slide. The text of each child will serve as the slide title. Each child block then in turn renders its children as the slide contents in a bulleted outline. For example, the Playground presentation below uses the following structure:

```
- {{presentation}}
  - First Slide
  - Second Slide
    - With a Subtitle on what we're all about
  - Third Slide
    - First bullet with a point
    - Second Bullet supporting that point
      - With a nested point!
    - Third bullet sealing the deal
  - Final Slide
```

If a slide has `{title}` in the title or has no children, it will render as a title slide. Otherwise, the slide will render as a content slide.

By default, presentations start on the first slide. If the cursor is in any of the other slide trees when the button is pressed, the presentation will start on that slide. When the presentation closes, it will return focus to the title block of whichever slide it was on.

Any blocks with images will be rendered without a bullet. Any bullets that are collapsed will be filtered out of the presentation view.

## Themes

There are 11 themes supported, which could be found [here](https://revealjs.com/themes/). To use one, add a `:{theme:[value]}` to the presentation button. For example, the demo below uses the black theme:

- `{{presentation:{theme:black}}}`

Note: currently Safari only supports the following three themes: black, white, and beige.

Apart from these themes, you could also use `roam/css` to style the presentation. Here are some classes to keep in mind:

- `reveal-viewport` - The full presentation container
- `slides` - The slide container
- `present` - The current slide
- `slide-background` - The slide background
- `navigate-left` - The go left button
- `navigate-right` - The go right button

## Notes

To add Speaker notes, add `{notes:true}` to the button text. The last bullet of each child will be used as the speaker notes of the slide. To combine with theme above, the button text would look like this:

- `{{presentation:{theme:sky}{notes:true}}}`

## Layouts

You could configure layouts per slide. To define a layout, add a `{layout:}` text in the top level block with the slide title. For example, to specify the default layout, it will look like

- `Slide Title {layout:default}`

The following layouts are also supported:

- `Image Right` - Split the slide vertically with the bullets on the left half and the image on the right half. The first bullet will be used for the image.
- `Image Left` - Split the slide vertically with the bullets on the right half and the image on the left half. The first bullet will be used for the image.
- `Image Center` - The image on the first bullet will take up the contents of the slide. Note that any other bullets will be hidden.
- `Iframe Right` - Split the slide vertically with the bullets on the left half and the iframe on the right half. The first bullet will be used for the iframe.
- `Iframe Left` - Split the slide vertically with the bullets on the right half and the iframe on the left half. The first bullet will be used for the iframe.
- `Iframe Center` - The iframe on the first bullet will take up the contents of the slide. Note that any other bullets will be hidden.
- `Media Right` - Split the slide vertically with the bullets on the left half and the media on the right half. The first bullet will be used for the media. Currently only supports `roam/render` media.
- `Media Left` - Split the slide vertically with the bullets on the right half and the media on the right half. The first bullet will be used for the media. Currently only supports `roam/render` media.
- `Media Center` - The media on the first bullet will take up the contents of the slide. Note that any other bullets will be hidden. Currently only supports `roam/render` media.

## Transitions

You could configure individual slides to have custom transitions. To give a slide a transition, add the `{transition:(type)}` attribute next to the slide title like this:

- `Slide Title {transition:slide}`

To apply to all of the slides in a presentation, add to it inside the presentation button:

- `{{presentation:{transition:slide}}}`

The following transition types are supported:

- `none` - Switch backgrounds instantly
- `fade` - Cross fade
- `slide` - Slide between backgrounds
- `convex` - Slide at a convex angle
- `concave` - Slide at a concave angle
- `zoom` - Scale the incoming slide up so it grows in from the center of the screen

## Collapsible

You could configure individual slides to have collapsible bullets. To make a slide collapsible, add the `{collapsible}` attribute next to the slide title like this:

- `Slide Title {collapsible}`

To apply to all of the slides in a presentation, add to it inside the presentation button:

- `{{presentation:{collapsible}}}`

If you apply collapsible to the whole presentation, you could then ignore it for specific slides by adding `:ignore` to the braces.

- `Slide Title {collapsible:ignore}`

## Auto Animate

You could configure individual slides to have automatically animate between them. The extension will make its best guess on matching elements to be animated across slides. To add animation to the slide, add the `{animate}` attribute next to the slide title like this:

- `Slide Title {animate}`

To apply to all of the slides in a presentation, add to it inside the presentation button:

- `{{presentation:{animate}}}`

## Hide

You could hide certain slides from your presentation by adding `{hide}` to the slide title like this:

- `Slide Title {hide}`

You could also hide any given bullet within the slide tree by placing `{hide}` on the bullet itself

## Resources

Check out some of [these presentations](https://roamresearch.com/#/app/nodebook/page/uOB7d3Kz7) put together and made public by [Ivo Velitchkov](https://twitter.com/kvistgaard)!

## Demo

![roamjs-presentation-demo](https://github.com/RoamJS/presentation/assets/3792666/49626b70-d325-4e66-bf7b-6aa35d05c392)

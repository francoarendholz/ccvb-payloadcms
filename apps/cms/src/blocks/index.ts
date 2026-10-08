import { AccordionBlock } from './Accordion'
import { CallToActionBlock } from './CallToAction'
import { CardGridBlock } from './CardGrid'
import { ContactsBlock } from './Contacts'
import { DocumentsListBlock } from './DocumentsList'
import { EventsListBlock } from './EventsList'
import { FormBlock } from './Form'
import { GalleryBlock } from './Gallery'
import { ImageBlock } from './Image'
import { ImageTextBlock } from './ImageText'
import { LogosBlock } from './Logos'
import { PostsListBlock } from './PostsList'
import { TextBlock } from './Text'

/** Alle Blöcke, die im Seiten-Layout zur Verfügung stehen. */
export const layoutBlocks = [
  TextBlock,
  ImageBlock,
  ImageTextBlock,
  CallToActionBlock,
  CardGridBlock,
  AccordionBlock,
  ContactsBlock,
  PostsListBlock,
  EventsListBlock,
  DocumentsListBlock,
  GalleryBlock,
  LogosBlock,
  FormBlock,
]

/** Blöcke, die im Fließtext von Beiträgen/Terminen eingebettet werden können. */
export const inlineBlocks = [ImageBlock, AccordionBlock, DocumentsListBlock]

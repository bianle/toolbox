import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PngToSvgPanel } from '@/tools/image-convert/png-to-svg'
import { SvgToPngPanel } from '@/tools/image-convert/svg-to-png'

export default function ImageConvertTool() {
  return (
    <Tabs defaultValue="png-to-svg">
      <TabsList>
        <TabsTrigger value="png-to-svg">PNG → SVG</TabsTrigger>
        <TabsTrigger value="svg-to-png">SVG → PNG</TabsTrigger>
      </TabsList>

      <TabsContent value="png-to-svg" className="pt-4">
        <PngToSvgPanel />
      </TabsContent>

      <TabsContent value="svg-to-png" className="pt-4">
        <SvgToPngPanel />
      </TabsContent>
    </Tabs>
  )
}

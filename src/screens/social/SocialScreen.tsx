import { useProfile } from "@/providers/ProfileProvider"

const sampleFriends = [{
  id: "1",
  name: "Jerome Mall"

}]
export default function SocialScreen() {
  const profile = useProfile()
  return (
    <div>
      {
        sampleFriends.map((prof) => (
          <div>
            {prof.name}
            {prof.id}
        </div>

        ))
      }
    </div>
  )
}

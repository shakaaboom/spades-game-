import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Layout } from "@/components/layout/Layout";
import { PawPrint, Award, Lightbulb, Swords, Scroll, HeartHandshake } from "lucide-react";

const HowToPlay = () => {
  const [activeTab, setActiveTab] = useState("basics");

  return (
    <Layout>
      <div className="py-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">How To Play Spades</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn everything you need to know about playing Spades, from basic rules to advanced strategies.
            </p>
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 mb-8">
              <TabsTrigger value="basics">
                <PawPrint className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Basics</span>
              </TabsTrigger>
              <TabsTrigger value="gameplay">
                <Swords className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Gameplay</span>
              </TabsTrigger>
              <TabsTrigger value="scoring">
                <Award className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Scoring</span>
              </TabsTrigger>
              <TabsTrigger value="strategies">
                <Lightbulb className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Strategies</span>
              </TabsTrigger>
              <TabsTrigger value="variations">
                <Scroll className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Variations</span>
              </TabsTrigger>
              <TabsTrigger value="etiquette">
                <HeartHandshake className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Etiquette</span>
              </TabsTrigger>
            </TabsList>

            {/* Basics Tab */}
            <TabsContent value="basics">
              <Card>
                <CardHeader>
                  <CardTitle>The Basics of Spades</CardTitle>
                  <CardDescription>
                    Spades is a trick-taking card game that originated in the United States in the 1930s.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Objective</h3>
                    <p>
                      The goal of Spades is to accurately predict how many "tricks" your partnership will win in each round, 
                      then work together to achieve that goal. Teams that make their bids earn points, while falling short or 
                      exceeding your bid by too much will result in penalties.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Players</h3>
                      <p>
                        Spades is typically played with 4 players in fixed partnerships, with partners sitting across from each other.
                        Each player receives 13 cards from a standard 52-card deck.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Trump Suit</h3>
                      <p>
                        Spades is always the trump suit. This means a Spade will win against any card from another suit, 
                        regardless of rank.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Card Ranking</h3>
                    <p className="mb-2">
                      Cards in Spades rank from highest to lowest: A (high), K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center my-4">
                      {["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"].map((rank) => (
                        <div key={rank} className="w-10 h-14 bg-white border border-gray-300 rounded-md flex items-center justify-center font-bold">
                          {rank}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Setting Up</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Players sit across from their partners</li>
                      <li>The dealer shuffles and deals all 52 cards (13 to each player)</li>
                      <li>Each player arranges their cards and makes a bid</li>
                      <li>Play begins with the player to the left of the dealer</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gameplay Tab */}
            <TabsContent value="gameplay">
              <Card>
                <CardHeader>
                  <CardTitle>Gameplay</CardTitle>
                  <CardDescription>
                    How to play a hand of Spades from start to finish
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="bidding">
                      <AccordionTrigger>The Bidding Phase</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p>
                          After the cards are dealt, each player bids on how many tricks they expect to take. Bidding 
                          starts with the player to the dealer's left and proceeds clockwise.
                        </p>
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Types of Bids</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li><span className="font-medium">Regular Bid:</span> Any number from 0 to 13</li>
                            <li><span className="font-medium">Nil:</span> A bid of zero tricks (high risk, high reward)</li>
                            <li><span className="font-medium">Blind Nil:</span> Bidding zero without looking at your cards (highest risk)</li>
                          </ul>
                        </div>
                        <p>
                          The sum of you and your partner's bids is your team's contract for the hand. Your goal is to 
                          collectively win exactly that many tricks.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="playing">
                      <AccordionTrigger>Playing Tricks</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p>
                          The player to the left of the dealer leads the first trick by playing any card except a Spade 
                          (unless they only have Spades). Each player must follow the suit led if possible.
                        </p>
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Key Rules</h4>
                          <ul className="list-disc list-inside space-y-1">
                            <li>You must follow the suit that was led if you can</li>
                            <li>If you can't follow suit, you may play any card including a Spade</li>
                            <li>Spades cannot be led until they have been "broken" (played in a previous trick)</li>
                            <li>The highest card of the suit led wins the trick, unless a Spade is played</li>
                            <li>The highest Spade wins the trick if any Spades are played</li>
                          </ul>
                        </div>
                        <p>
                          The winner of each trick leads the next one. Play continues until all 13 tricks have been played.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="spades-breaking">
                      <AccordionTrigger>Breaking Spades</AccordionTrigger>
                      <AccordionContent>
                        <p>
                          Spades cannot be led until a Spade has been played on another trick (usually when a player cannot 
                          follow the suit that was led). This is called "breaking Spades."
                        </p>
                        <p className="mt-2">
                          After Spades have been broken, players may lead with a Spade in subsequent tricks.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="hand-completion">
                      <AccordionTrigger>Completing a Hand</AccordionTrigger>
                      <AccordionContent>
                        <p>
                          A hand is complete when all 13 tricks have been played. At this point, each team's score is 
                          calculated based on their bid and the number of tricks they actually won.
                        </p>
                        <p className="mt-2">
                          After scoring, the deal passes to the left and a new hand begins.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scoring Tab */}
            <TabsContent value="scoring">
              <Card>
                <CardHeader>
                  <CardTitle>Scoring System</CardTitle>
                  <CardDescription>
                    Understanding how points are earned and penalties are assessed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 border rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Making Your Bid</h3>
                      <p className="mb-2">
                        When your team wins exactly the number of tricks bid or more:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>10 points for each trick bid</li>
                        <li>1 point for each overtrick (tricks won beyond the bid)</li>
                      </ul>
                      <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                        <strong>Example:</strong> If your team bids 5 tricks and wins 7, you score 
                        (5 × 10) + (2 × 1) = 52 points.
                      </div>
                    </div>
                    
                    <div className="p-5 border rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Missing Your Bid</h3>
                      <p className="mb-2">
                        When your team wins fewer tricks than bid:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>10 point penalty for each trick bid</li>
                      </ul>
                      <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                        <strong>Example:</strong> If your team bids 8 tricks but wins only 6, you lose 
                        8 × 10 = 80 points.
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Special Bids</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Nil Bid</h4>
                        <p className="mb-2">
                          When a player bids zero tricks:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>+100 points if successful (player takes no tricks)</li>
                          <li>-100 points if failed (player takes one or more tricks)</li>
                        </ul>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your partner's regular bid is scored separately.
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Blind Nil Bid</h4>
                        <p className="mb-2">
                          When a player bids zero without looking at their cards:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>+200 points if successful</li>
                          <li>-200 points if failed</li>
                        </ul>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Very risky but potentially rewarding.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sandbagging Rule</h3>
                    <p>
                      To prevent teams from consistently underbidding, many games implement a sandbagging penalty:
                    </p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p>
                        When a team accumulates 10 or more overtricks across multiple hands, they receive a 100-point penalty 
                        and their overtrick count is reduced by 10.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Winning the Game</h3>
                    <p>
                      The first team to reach the target score (typically 500 points) wins the game. If both teams reach the 
                      target in the same hand, the team with the higher score wins.
                    </p>
                    <p>
                      Alternatively, some games are played for a fixed number of hands, with the highest-scoring team winning.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Strategies Tab */}
            <TabsContent value="strategies">
              <Card>
                <CardHeader>
                  <CardTitle>Winning Strategies</CardTitle>
                  <CardDescription>
                    Advanced techniques to improve your Spades game
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Bidding Strategies</h3>
                      <ul className="space-y-3">
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Count Sure Tricks:</span> Aces and high Spades are usually guaranteed wins.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Consider Distribution:</span> Having cards in only one or two suits can be an advantage.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Team Coordination:</span> Listen to your partner's bid before finalizing yours.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Bid Conservatively:</span> It's often better to bid slightly under what you expect to take.
                        </li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Playing Techniques</h3>
                      <ul className="space-y-3">
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Card Counting:</span> Keep track of played cards, especially Spades.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Signaling:</span> Lead high cards to show strength in a suit to your partner.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Trump Management:</span> Save your Spades for when they'll have maximum impact.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Ducking:</span> Sometimes deliberately losing a trick can give your team an advantage.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Partnership Communication</h3>
                    <p>
                      Spades is a partnership game, and successful teams develop systems to share information through their play.
                    </p>
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <h4 className="font-medium">Common Signals:</h4>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Leading the highest card in a suit shows strength in that suit</li>
                        <li>Leading a middle card often indicates no strong preference</li>
                        <li>Playing a higher card than necessary can signal strength in that suit</li>
                        <li>Deliberately taking a trick when your partner is winning can signal to them that you can handle more tricks</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Special Situations</h3>
                    
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="nil-strategy">
                        <AccordionTrigger>Supporting a Nil Bid</AccordionTrigger>
                        <AccordionContent>
                          <p>When your partner bids Nil:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Lead suits where your partner is likely to be void</li>
                            <li>Play high cards to "cover" your partner when possible</li>
                            <li>Consider overbidding slightly to account for protecting your partner</li>
                            <li>Try to win the lead whenever possible to maintain control</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="endgame">
                        <AccordionTrigger>Endgame Tactics</AccordionTrigger>
                        <AccordionContent>
                          <p>
                            In the final hands of a game, your strategy may need to adjust based on the score:
                          </p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>If ahead, play conservatively and make safe bids</li>
                            <li>If behind, consider riskier plays like Nil or Blind Nil</li>
                            <li>Pay attention to the sandbag count</li>
                            <li>Sometimes deliberately setting yourself can be strategic if it prevents the opponents from reaching the target score</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="breaking-spades">
                        <AccordionTrigger>Controlling When Spades Break</AccordionTrigger>
                        <AccordionContent>
                          <p>
                            The timing of when Spades are first played can significantly impact the game:
                          </p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>If you have strong Spades, try to force an early break</li>
                            <li>If your Spades are weak, try to delay the breaking of Spades</li>
                            <li>Lead suits where opponents are likely to be void to force them to play Spades</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variations Tab */}
            <TabsContent value="variations">
              <Card>
                <CardHeader>
                  <CardTitle>Game Variations</CardTitle>
                  <CardDescription>
                    Different ways to play Spades to add excitement and challenge
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 border rounded-lg space-y-3">
                      <h3 className="text-lg font-semibold">Cutthroat Spades (3 Players)</h3>
                      <p>
                        Each player plays independently against the others:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Deal 17 cards to each player (discard 1)</li>
                        <li>Each player bids and scores individually</li>
                        <li>No partnerships or team bidding</li>
                      </ul>
                    </div>
                    
                    <div className="p-5 border rounded-lg space-y-3">
                      <h3 className="text-lg font-semibold">Individual Spades (4 Players)</h3>
                      <p>
                        Similar to standard Spades, but with no partnerships:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Each player bids and scores separately</li>
                        <li>More complex strategy with no partner support</li>
                        <li>Often played to 250 points</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 border rounded-lg space-y-3">
                      <h3 className="text-lg font-semibold">Suicide Spades</h3>
                      <p>
                        A high-risk variant with an interesting twist:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Teams must bid exactly 7 tricks total</li>
                        <li>No more, no less than 7 tricks combined</li>
                        <li>Extremely difficult to coordinate</li>
                      </ul>
                    </div>
                    
                    <div className="p-5 border rounded-lg space-y-3">
                      <h3 className="text-lg font-semibold">Mirror Spades</h3>
                      <p>
                        Partners must match each other's tricks:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Partners must win the same number of tricks</li>
                        <li>If one partner takes 4 tricks, the other must also take 4</li>
                        <li>Penalty applied if partners' tricks don't match</li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Scoring Variations</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">No Sandbags</h4>
                        <p>
                          A simpler version without overtrick penalties:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Overtricks are worth 1 point each</li>
                          <li>No penalty for accumulating too many overtricks</li>
                          <li>Encourages precise bidding for different reasons</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Negative Overtricks</h4>
                        <p>
                          A stricter version that punishes overbidding:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Overtricks are worth -1 point each</li>
                          <li>Encourages exact bidding</li>
                          <li>Sometimes called "Precision Spades"</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border rounded-lg space-y-3">
                    <h3 className="text-lg font-semibold">Online Spades</h3>
                    <p>
                      Common variations found in digital versions:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Timed turns (10-30 seconds per play)</li>
                      <li>Rating systems and ranked matches</li>
                      <li>Optional automatic bidding assistance</li>
                      <li>Chat systems for table talk</li>
                      <li>Statistics tracking for performance</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Etiquette Tab */}
            <TabsContent value="etiquette">
              <Card>
                <CardHeader>
                  <CardTitle>Spades Etiquette</CardTitle>
                  <CardDescription>
                    Proper conduct and sportsmanship when playing Spades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Table Talk</h3>
                      <div className="p-4 border rounded-lg space-y-2">
                        <h4 className="font-medium">Allowed</h4>
                        <ul className="list-disc list-inside">
                          <li>General discussion unrelated to the game</li>
                          <li>Asking how many tricks have been won (if visible)</li>
                          <li>Reminding partner of the rules</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg space-y-2">
                        <h4 className="font-medium">Not Allowed</h4>
                        <ul className="list-disc list-inside">
                          <li>Discussing your cards with partner</li>
                          <li>Giving hints about what to play</li>
                          <li>Signals outside of regular play</li>
                          <li>Showing your cards to others</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Game Conduct</h3>
                      <ul className="space-y-3">
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Play in Turn:</span> Always wait for your turn to play.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">No Renege:</span> Always follow suit if you can; correct mistakes immediately.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Timely Play:</span> Don't unnecessarily delay the game.
                        </li>
                        <li className="p-3 border rounded-lg">
                          <span className="font-medium">Gracious Behavior:</span> Win and lose with equal grace.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Partnership Respect</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <ul className="list-disc list-inside space-y-2">
                        <li>Don't criticize your partner's play, especially during the game</li>
                        <li>Remember that mistakes happen to everyone</li>
                        <li>Focus on improving as a team rather than assigning blame</li>
                        <li>Discuss strategy privately between games, not during play</li>
                        <li>Remember that it's just a game and should be enjoyable</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Online Etiquette</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Chat Etiquette</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Keep conversation friendly and appropriate</li>
                          <li>Don't spam or flood the chat</li>
                          <li>Avoid discussing strategy in open chat</li>
                          <li>Be respectful to all players</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Game Behaviors</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Play your turn promptly</li>
                          <li>Don't quit mid-game if you're losing</li>
                          <li>Let others know if you need to step away briefly</li>
                          <li>Report cheaters through proper channels</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Handling Disputes</h3>
                    <p className="mb-3">
                      Even in friendly games, disagreements can arise. Here's how to handle them:
                    </p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Refer to the established rules agreed upon before the game started</li>
                      <li>If playing casually, consider a do-over for honest mistakes</li>
                      <li>In tournaments, defer to the designated judge or director</li>
                      <li>Focus on finding a fair solution rather than "winning" the argument</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default HowToPlay;

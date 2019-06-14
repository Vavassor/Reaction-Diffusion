// Computes the divergence of a vector field.

precision mediump float;

uniform float delta_time;
uniform float density;
uniform sampler2D velocity_field;
uniform vec2 velocity_field_size;

varying vec2 surface_texcoord;

void main()
{
    vec2 pixel_size = 1.0 / velocity_field_size;
    float east = texture2D(velocity_field, surface_texcoord + vec2(pixel_size.x, 0.0)).x;
    float west = texture2D(velocity_field, surface_texcoord - vec2(pixel_size.x, 0.0)).x;
    float north = texture2D(velocity_field, surface_texcoord + vec2(0.0, pixel_size.y)).y;
    float south = texture2D(velocity_field, surface_texcoord - vec2(0.0, pixel_size.y)).y;
    float divergence = (east - west) + (north - south);

    // The divergence is multiplied by an extra term before being stored. This
    // term is actually part of the pressure equation, but would have to be
    // recalculated each iteration. So it's easier to do that step here.
    float result = (-2.0 * pixel_size.x * density / delta_time) * divergence;

    gl_FragColor = vec4(result, 0.0, 0.0, 1.0);
}